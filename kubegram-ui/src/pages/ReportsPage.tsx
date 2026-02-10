import React from 'react';

/**
 * Reports Page
 * 
 * Empty page for error reporting fallback.
 * Users are directed here when OAuth login fails and they need to submit a report.
 * 
 * This page is publicly accessible and doesn't require authentication.
 */
const ReportsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Center</h1>
        <p className="text-gray-600">
          This page is currently under development.
          <br />
          Please check back later for the report submission form.
        </p>
      </div>
    </div>
  );
};

export default ReportsPage;