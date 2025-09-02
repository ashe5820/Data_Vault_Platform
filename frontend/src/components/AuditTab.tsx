"use client";
import React from 'react';
import {Clock} from 'lucide-react';


interface AuditTabProp {  // Add any props you might need in the future
    }

const AuditTab: React.FC<AuditTabProp> = () => {
    return <div className="bg-white rounded-lg shadow p-8">
    <h2 className="text-xl font-semibold mb-6 flex items-center">
      <Clock className="w-6 h-6 mr-2" />
      Audit Trail
    </h2>
    <p className="text-gray-600">Complete blockchain audit trail for all transactions.</p>
    <div className="mt-8">
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-500">Blockchain events will appear here</p>
      </div>
    </div>
  </div>;
}

export default AuditTab;
