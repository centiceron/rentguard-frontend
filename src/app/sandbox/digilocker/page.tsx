"use client";

import React, { useState } from "react";
import { ShieldCheck, FileDigit, User, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 🔥 The 10 Pre-Loaded Test Personas (No phone numbers, just pure DigiLocker KYC data)
const mockProfiles = [
  {
    id: "p1",
    label: "Landlord: Centi (MH)",
    name: "Centi",
    address: "Villa 12, Palm Meadows, Powai, Mumbai, 400076",
    aadhaar: "XXXX-XXXX-9012",
  },
  {
    id: "p2",
    label: "Tenant: Priya Desai (MH)",
    name: "Priya Desai",
    address: "402, Lotus Apartments, Andheri East, Mumbai, 400069",
    aadhaar: "XXXX-XXXX-7777",
  },
  {
    id: "p3",
    label: "Tenant: Rahul Verma (KA)",
    name: "Rahul Verma",
    address:
      "88, Bluebell Apartments, Koramangala 4th Block, Bangalore, 560034",
    aadhaar: "XXXX-XXXX-3333",
  },
  {
    id: "p4",
    label: "Landlord: Amit Singh (DL)",
    name: "Amit Singh",
    address: "15, Vasant Vihar, New Delhi, 110057",
    aadhaar: "XXXX-XXXX-4444",
  },
  {
    id: "p5",
    label: "Tenant: Neha Gupta (DL)",
    name: "Neha Gupta",
    address: "Flat 3B, Saket Court, New Delhi, 110017",
    aadhaar: "XXXX-XXXX-6666",
  },
  {
    id: "p6",
    label: "Landlord: Sourav Das (WB)",
    name: "Sourav Das",
    address: "45, Salt Lake City Sector 1, Kolkata, 700064",
    aadhaar: "XXXX-XXXX-3333",
  },
  {
    id: "p7",
    label: "Tenant: Ananya Sen (WB)",
    name: "Ananya Sen",
    address: "12, Park Street, Kolkata, 700016",
    aadhaar: "XXXX-XXXX-6666",
  },
  {
    id: "p8",
    label: "Landlord: Karthik Rajan (TN)",
    name: "Karthik Rajan",
    address: "8, Poes Garden, Chennai, 600086",
    aadhaar: "XXXX-XXXX-7777",
  },
  {
    id: "p9",
    label: "Tenant: Divya Krishnan (TN)",
    name: "Divya Krishnan",
    address: "22, OMR Road, Sholinganallur, Chennai, 600119",
    aadhaar: "XXXX-XXXX-2222",
  },
  {
    id: "p10",
    label: "Witness: Vikram Singh (Generic)",
    name: "Vikram Singh",
    address: "101, Galaxy Heights, Khar West, Mumbai, 400052",
    aadhaar: "XXXX-XXXX-5555",
  },
];

export default function DigiLockerSandbox() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  const handleProfileSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = e.target.value;
    if (!profileId) return;

    const profile = mockProfiles.find((p) => p.id === profileId);
    if (profile) {
      setName(profile.name);
      setAddress(profile.address);
      setAadhaar(profile.aadhaar);
    }
  };

  const handleVerify = () => {
    if (!name || !address || !aadhaar) {
      return alert("Please fill all fields to simulate a valid ID.");
    }

    // Only returning Name, Address, and Aadhaar (Strict KYC data)
    const payload = {
      name,
      address,
      aadhaar,
    };

    if (window.opener) {
      window.opener.postMessage({ type: "DIGILOCKER_SUCCESS", payload }, "*");
      window.close();
    } else {
      alert(
        "This page must be opened as a popup to communicate with the main app.",
      );
    }
  };

  const handleFail = () => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "DIGILOCKER_FAILED", error: "User denied Aadhaar consent." },
        "*",
      );
      window.close();
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans'>
      <div className='bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200'>
        <div className='flex flex-col items-center mb-6 border-b border-slate-100 pb-6'>
          <div className='h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner'>
            <ShieldCheck className='h-8 w-8 text-blue-600' />
          </div>
          <h1 className='text-2xl font-extrabold text-slate-900 tracking-tight'>
            DigiLocker
          </h1>
          <p className='text-sm text-slate-500 font-medium mt-1'>
            Developer Sandbox Mode
          </p>
        </div>

        <div className='mb-6 space-y-2'>
          <label className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
            Quick Load Persona
          </label>
          <div className='relative'>
            <Users className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
            <select
              className='w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md px-3 py-2 pl-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer'
              onChange={handleProfileSelect}
              defaultValue=''
            >
              <option value='' disabled>
                Select a test identity...
              </option>
              {mockProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='space-y-4 mb-8'>
          <div className='relative'>
            <User className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
            <Input
              placeholder='Legal Name'
              className='pl-10'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='relative'>
            <MapPin className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
            <Input
              placeholder='Permanent Address'
              className='pl-10'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className='relative'>
            <FileDigit className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
            <Input
              placeholder='Aadhaar Number'
              className='pl-10 font-mono'
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
            />
          </div>
        </div>

        <div className='space-y-3'>
          <Button
            onClick={handleVerify}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md transition-all'
          >
            Simulate Verification
          </Button>
          <Button
            onClick={handleFail}
            variant='outline'
            className='w-full text-slate-500 border-slate-300 hover:bg-slate-100 h-10'
          >
            Simulate Failure
          </Button>
        </div>
      </div>
    </div>
  );
}
