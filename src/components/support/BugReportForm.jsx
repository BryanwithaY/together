import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Send, Upload, X } from 'lucide-react';
import VoiceInput from '../ui/VoiceInput';

export default function BugReportForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('bug');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedFiles = [];
      for (const file of selectedFiles) {
        const response = await base44.integrations.Core.UploadFile({ file });
        uploadedFiles.push({ name: file.name, url: response.file_url });
      }
      setFiles(prev => [...prev, ...uploadedFiles]);
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await base44.functions.invoke('submitBugReport', {
        title,
        description,
        type,
        attachments: files
      });
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setType('bug');
      setFiles([]);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-2">Report an Issue</h3>
      <p className="text-sm text-stone-600 mb-6">Found a bug or have feedback? Let us know and we'll look into it right away.</p>

      {submitted && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">Thanks! Your report has been sent to our team.</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Issue Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="bug">Bug Report</option>
            <option value="feedback">Feature Request</option>
            <option value="support">General Support</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Title</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <VoiceInput value={title} onChange={setTitle} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Details</label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible to help us understand the issue..."
              required
              rows={5}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none pr-12"
            />
            <div className="absolute bottom-2 right-2">
              <VoiceInput value={description} onChange={setDescription} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Attachments (Optional)</label>
          <p className="text-xs text-stone-500 mb-3">Screenshots, screen recordings, or files to help explain the issue</p>
          <label className="border-2 border-dashed border-stone-300 rounded-lg p-4 cursor-pointer hover:border-stone-400 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4 text-stone-500" />
            <span className="text-sm text-stone-600">Click to upload files</span>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={uploadingFiles}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
          </label>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-stone-50 p-2 rounded border border-stone-200">
                  <span className="text-sm text-stone-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-stone-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || uploadingFiles || !title.trim() || !description.trim()}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Sending...' : uploadingFiles ? 'Uploading files...' : 'Send Report'}
        </Button>
      </form>
    </div>
  );
}