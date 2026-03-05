import React from 'react';
import { useRelationship } from './RelationshipContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Wraps a page/component that requires an active relationship.
 * If no relationship exists, prompts user to create one.
 */
export default function RelationshipGate({ children }) {
  const { loading, activeRelationship } = useRelationship();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (!activeRelationship) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto">
            <Plus className="w-9 h-9 text-stone-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Welcome to Together</h2>
            <p className="text-sm text-stone-500 mt-2 max-w-xs mx-auto">
              Create your first shared space to start logging moments with the people that matter.
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('RelationshipSetup'))}
            className="bg-stone-800 hover:bg-stone-900 text-white rounded-xl px-8"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create a Space
          </Button>
        </motion.div>
      </div>
    );
  }

  return children;
}