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
    const keysToDelete = [...new Set([page.storage_key, page.rendered_key, page.source_key, ...(page.project_asset_keys ?? [])].filter(Boolean))] as string[];
    // Keep the database row when object cleanup is incomplete so deletion is
    // retryable instead of silently leaving orphaned storage objects.
    await deleteFiles(keysToDelete);
    await deletePage(id, auth.userId, { serviceRole: true });

    return NextResponse.json({
      ok: true,
      deleted: {
        id: page.id,
        name: page.name,
      },
    });
  } catch (err) {
    console.error("[api/v1/pages] delete_failed", {
      code: "page_cleanup_failed",
      pageId: id,
      errorType: err instanceof Error ? err.name : "unknown",
    });
    return apiError("delete_failed", "Page deletion could not complete; retry cleanup using the Page id.", 500);
  }
}
