"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Building, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 🚨 The Auto-Redirect Logic
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      router.push(
        user.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard",
      );
    } else {
      // If no token, stop checking and render the landing page
      setIsChecking(false);
    }
  }, [router]);

  // Prevent the page from flashing briefly before the redirect kicks in
  if (isChecking) return null;

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4'>
      <div className='text-center max-w-3xl'>
        <div className='flex items-center justify-center gap-3 mb-6'>
          <ShieldCheck className='h-16 w-16 text-indigo-600' />
          <h1 className='text-5xl font-black text-slate-900 tracking-tight'>
            RentGuard AI
          </h1>
        </div>

        <p className='text-xl text-slate-500 mb-10 font-medium leading-relaxed'>
          The Zero-Trust platform for legally binding, E-Stamped rental
          agreements. Powered by cryptographic handshakes and Aadhaar-verified
          identities.
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link href='/auth'>
            <Button className='w-full sm:w-auto h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 shadow-lg'>
              <Key className='mr-2 h-5 w-5' /> Log In
            </Button>
          </Link>

          <Link href='/auth?action=signup'>
            <Button className='w-full sm:w-auto h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg'>
              <Building className='mr-2 h-5 w-5' /> Create Account{" "}
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
