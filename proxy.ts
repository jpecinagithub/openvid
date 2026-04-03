import { updateSession } from "@/utils/supabase/middleware";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
 const response = await updateSession(request);

  const country = 
    request.headers.get('x-vercel-ip-country') || 
    request.headers.get('cf-ipcountry') || 
    'UNKNOWN';

  response.headers.set('x-user-country', country);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
