import React, { useState, useEffect } from 'react';

const EmailConfirmationDialog = ({ isOpen, onClose, mentees, emailData, onConfirm }) => {
  const [sending, setSending] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [confirmationState, setConfirmationState] = useState({ show: false, handler: null });
  const [emailGroups, setEmailGroups] = useState([]);

  // Calculate email groups when component mounts or mentees change
  useEffect(() => {
    if (mentees.length > 0) {
      const BATCH_SIZE = 15;
      const groups = [];
      for (let i = 0; i < mentees.length; i += BATCH_SIZE) {
        groups.push(mentees.slice(i, i + BATCH_SIZE));
      }
      setEmailGroups(groups);
      setTotalBatches(groups.length);
    }
  }, [mentees]);

  const handleSendEmails = async () => {
    setSending(true);
    try {
      for (let i = 0; i < emailGroups.length; i++) {
        setCurrentBatch(i + 1);
        const group = emailGroups[i];
        const recipients = group
          .map(mentee => `${mentee.name.trim()} <${mentee.email.trim()}>`)
          .join(',');
        
        const mailtoUrl = `mailto:${recipients}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        window.open(mailtoUrl, '_blank');

        // Wait for user confirmation
        await new Promise((resolve, reject) => {
          setConfirmationState({
            show: true,
            handler: (confirmed) => {
              setConfirmationState({ show: false, handler: null });
              if (confirmed) {
                resolve();
              } else {
                reject(new Error('User cancelled'));
              }
            }
          });
        });
      }

      setSending(false);
      onConfirm(true);
    } catch (error) {
      console.log('Error sending emails:', error);
      setSending(false);
      onConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          {sending ? 'Sending Emails' : 'Review Email Recipients'}
        </h2>
        
        {sending ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-white">Processing batch {currentBatch} of {totalBatches}...</p>
            <p className="text-gray-400 text-sm mt-2">
              {confirmationState.show ? 
                'Please confirm after sending the current batch' : 
                'Please keep the email client open'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-white font-semibold mb-2">Email will be sent in {emailGroups.length} batch(es)</h3>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {emailGroups.map((group, batchIndex) => (
                  <div key={batchIndex} className="mb-4">
                    <h4 className="text-gray-300 font-medium mb-2">Batch {batchIndex + 1}</h4>
                    <table className="w-full">
                      <thead className="bg-black/30">
                        <tr>
                          <th className="text-left text-gray-300 py-2 px-3">Name</th>
                          <th className="text-left text-gray-300 py-2 px-3">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((mentee, index) => (
                          <tr key={mentee.MUJid || `${batchIndex}-${index}`} className="border-t border-white/10">
                            <td className="text-white py-2 px-3">{mentee.name}</td>
                            <td className="text-gray-300 py-2 px-3">{mentee.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-300">Total Recipients: {mentees.length}</p>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmails}
                  className="btn-orange"
                >
                  Start Sending Emails
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmationState.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Email Batch</h3>
            <p className="text-gray-300 mb-4">
              Batch {currentBatch} of {totalBatches} has been opened.
              <br />
              Please confirm after sending the current batch.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => confirmationState.handler?.(false)}
                className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel Process
              </button>
              <button
                onClick={() => confirmationState.handler?.(true)}
                className="btn-orange"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailConfirmationDialog;