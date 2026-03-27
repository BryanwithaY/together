import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Wave 2 — Read-only moment privacy audit.
 * Admin only. No data writes. Safe to run in production.
 *
 * Scans Moment records and returns counts and example IDs for:
 *   1. is_private=true but visibility != 'private'         (flag mismatch A)
 *   2. self_reflection with shared_with_partner undefined  (ambiguous state)
 *   3. self_reflection with shared_with_partner=false but visibility='relationship' (contradictory)
 *   4. visibility='private' but is_private not set         (inconsistent — visibility field set manually)
 *   5. Overall privacy field population rates
 */

// Matches server resolver in filterMomentsForFacilitator.js
function resolveVisibility(moment) {
  if (moment.is_private === true) return 'private';
  if (moment.type === 'self_reflection' && moment.shared_with_partner !== true) return 'private';
  return moment.visibility || 'relationship';
}

function excerpt(moments, max = 5) {
  return moments.slice(0, max).map(m => ({
    id: m.id,
    type: m.type,
    visibility: m.visibility,
    is_private: m.is_private,
    shared_with_partner: m.shared_with_partner,
    resolved: resolveVisibility(m)
  }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch a large sample — limit to 1000 for safety
    const moments = await base44.asServiceRole.entities.Moment.list('-created_date', 1000);

    const total = moments.length;

    // Issue A: is_private=true but visibility field != 'private'
    const flagMismatchA = moments.filter(m =>
      m.is_private === true && m.visibility && m.visibility !== 'private'
    );

    // Issue B: self_reflection with shared_with_partner undefined/null (ambiguous)
    const selfReflectionAmbiguous = moments.filter(m =>
      m.type === 'self_reflection' &&
      m.shared_with_partner === undefined || (m.type === 'self_reflection' && m.shared_with_partner === null)
    );

    // Issue C: self_reflection where shared_with_partner=false but visibility='relationship' (contradictory)
    const selfReflectionContradictory = moments.filter(m =>
      m.type === 'self_reflection' &&
      m.shared_with_partner === false &&
      m.visibility === 'relationship'
    );

    // Issue D: visibility='private' but is_private is not true (visibility set but flag not)
    const visibilityPrivateNotFlagged = moments.filter(m =>
      m.visibility === 'private' &&
      m.is_private !== true
    );

    // Coverage stats
    const withIsPrivate = moments.filter(m => m.is_private === true).length;
    const withVisibilitySet = moments.filter(m => !!m.visibility).length;
    const selfReflections = moments.filter(m => m.type === 'self_reflection');
    const selfReflectionsShared = selfReflections.filter(m => m.shared_with_partner === true).length;

    // Resolver distribution across all moments
    const resolvedCounts = { private: 0, relationship: 0, tagged_only: 0 };
    moments.forEach(m => {
      const v = resolveVisibility(m);
      resolvedCounts[v] = (resolvedCounts[v] || 0) + 1;
    });

    return Response.json({
      success: true,
      sampled: total,
      run_at: new Date().toISOString(),

      coverage: {
        total_moments: total,
        with_is_private_true: withIsPrivate,
        with_visibility_set: withVisibilitySet,
        self_reflection_total: selfReflections.length,
        self_reflection_shared: selfReflectionsShared,
        self_reflection_unambiguous: selfReflections.filter(m => m.shared_with_partner === true || m.shared_with_partner === false).length
      },

      resolved_distribution: resolvedCounts,

      issues: {
        flag_mismatch_a: {
          description: 'is_private=true but visibility field is not "private"',
          count: flagMismatchA.length,
          examples: excerpt(flagMismatchA)
        },
        self_reflection_ambiguous: {
          description: 'self_reflection with shared_with_partner undefined/null',
          count: selfReflectionAmbiguous.length,
          examples: excerpt(selfReflectionAmbiguous)
        },
        self_reflection_contradictory: {
          description: 'self_reflection with shared_with_partner=false but visibility="relationship"',
          count: selfReflectionContradictory.length,
          examples: excerpt(selfReflectionContradictory)
        },
        visibility_private_not_flagged: {
          description: 'visibility="private" but is_private is not true',
          count: visibilityPrivateNotFlagged.length,
          examples: excerpt(visibilityPrivateNotFlagged)
        }
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});