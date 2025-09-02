"use client";
import React from 'react';
import { Key, Users } from 'lucide-react';


interface LicensesTabProp {  // Add any props you might need in the future
    licenses?: [];
    isLoading?: boolean;
  
    }


const LicensesTab: React.FC<LicensesTabProp> = ({ licenses = [], isLoading = false }) => {
    if (isLoading) {
        return (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Key className="w-6 h-6 mr-2" />
              License Management
            </h2>
            <p className="text-gray-600">Loading licenses...</p>
          </div>
        );
      }
    
      return (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Key className="w-6 h-6 mr-2" />
            License Management
          </h2>
          <p className="text-gray-600">View and manage licenses for your protected assets.</p>
          
          {licenses.length > 0 ? (
            <div className="mt-6">
              {/* Render actual licenses here */}
              {/* {licenses.map(license => (
                <div key={license.id} className="border p-4 rounded-lg mb-4">
                  <h3 className="font-semibold">{license.name}</h3>
                  <p>Licensee: {license.licensee}</p>
                  <p>Status: {license.status}</p>
                </div>
              ))} */}
            </div>
          ) : (
            <div className="mt-8 text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active licenses</p>
            </div>
          )}
        </div>
      );
    };
    
export default LicensesTab;