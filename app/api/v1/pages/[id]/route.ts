import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-tokens";
import { deletePage, getPageById } from "@/lib/pages";
import { deleteFiles } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("unauthorized", auth.error, auth.status);
  }

  const { id } = await params;
  const page = await getPageById(id, { serviceRole: true });

  if (!page || page.user_id !== auth.userId) {
    return apiError("not_found", "Page not found.", 404);
  }

  try {
    await deletePage(id, auth.userId, { serviceRole: true });
    const keysToDelete = [page.storage_key, page.source_key].filter(Boolean) as string[];
    await deleteFiles(keysToDelete);

    return NextResponse.json({
      ok: true,
      deleted: {
        id: page.id,
        name: page.name,
      },
    });
  } catch (err) {
    console.error("[api/v1/pages] delete error:", err);
    return apiError("delete_failed", (err as Error).message, 500);
  }
}
