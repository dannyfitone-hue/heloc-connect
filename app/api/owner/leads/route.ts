import {NextResponse} from "next/server";import {supabaseAdmin} from "@/lib/supabaseAdmin";
export async function GET(){
 const s=supabaseAdmin();
 const{data,error}=await s.from("leads").select("*").order("created_at",{ascending:false});
 if(error)return NextResponse.json({error:error.message},{status:500});
 const leads=data||[];
 const ids=leads.map((l:any)=>l.id);
 let notes:any[]=[]; let documents:any[]=[];
 if(ids.length){
  const nr=await s.from("lead_notes").select("*").in("lead_id",ids).order("created_at",{ascending:false});
  if(!nr.error) notes=nr.data||[];
  const dr=await s.from("lead_documents").select("*").in("lead_id",ids).order("created_at",{ascending:false});
  if(!dr.error) documents=dr.data||[];
 }
 const enriched=leads.map((lead:any)=>({
  ...lead,
  notes:notes.filter((n:any)=>n.lead_id===lead.id),
  documents:documents.filter((d:any)=>d.lead_id===lead.id)
 }));
 return NextResponse.json({leads:enriched});
}
