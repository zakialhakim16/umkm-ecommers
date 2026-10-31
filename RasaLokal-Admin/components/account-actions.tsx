"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function AccountActions(){const router=useRouter();async function logout(){const client=createClient();if(client)await client.auth.signOut();router.replace("/login");router.refresh()}return <button className="button danger" onClick={logout}><LogOut size={16}/>Keluar dari akun</button>}
