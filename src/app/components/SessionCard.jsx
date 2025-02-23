import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SessionCard({ session, onArchive }) {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this session?')) return;
    
    setIsArchiving(true);
    try {
      const response = await fetch('/api/admin/academicSession/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: session._id }),
      });

      if (!response.ok) throw new Error('Failed to archive session');

      toast.success('Session archived successfully');
      if (onArchive) onArchive(session._id);
    } catch (error) {
      console.error('Error archiving session:', error);
      toast.error('Failed to archive session');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* ...existing card content... */}
      
      {!session.isArchived && (
        <button
          onClick={handleArchive}
          disabled={isArchiving}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isArchiving ? 'Archiving...' : 'Archive Data'}
        </button>
      )}
      
      {session.isArchived && (
        <span className="mt-2 text-sm text-gray-500">
          Archived on {new Date(session.archivedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
