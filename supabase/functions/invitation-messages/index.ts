const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}

function getSecretKey() {
  const secretKeys =
    Deno.env.get("SUPABASE_SECRET_KEYS");

  if (secretKeys) {
    const parsed =
      JSON.parse(secretKeys) as Record<string, string>;

    if (parsed.default) {
      return parsed.default;
    }
  }

  const legacyServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (legacyServiceRoleKey) {
    return legacyServiceRoleKey;
  }

  throw new Error("Server configuration is unavailable.");
}

Deno.serve(
  async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders,
        },
      );
    }

    if (request.method !== "GET") {
      return jsonResponse(
        { error: "method_not_allowed" },
        405,
      );
    }

    const requestUrl = new URL(request.url);
    const rawPosition =
      requestUrl.searchParams.get("position") ?? "1";
    const position = Number(rawPosition);

    if (
      !Number.isSafeInteger(position) ||
      position < 1 ||
      position > 10000
    ) {
      return jsonResponse(
        { error: "invalid_request" },
        400,
      );
    }

    try {
      const supabaseUrl =
        Deno.env.get("SUPABASE_URL");

      if (!supabaseUrl) {
        throw new Error(
          "Server configuration is unavailable.",
        );
      }

      const lookupUrl = new URL(
        `${supabaseUrl}/rest/v1/invitation_guests`,
      );

      lookupUrl.searchParams.set(
        "select",
        "code,name",
      );

      lookupUrl.searchParams.set(
        "order",
        "code.asc",
      );

      const offset = position - 1;
      const databaseResponse = await fetch(
        lookupUrl,
        {
          headers: {
            "Accept": "application/json",
            "apikey": getSecretKey(),
            "Prefer": "count=exact",
            "Range": `${offset}-${offset}`,
            "Range-Unit": "items",
          },
        },
      );

      if (databaseResponse.status === 416) {
        return jsonResponse(
          { error: "not_found" },
          404,
        );
      }

      if (!databaseResponse.ok) {
        throw new Error("Guest lookup failed.");
      }

      const guests = await databaseResponse.json() as Array<{
        code: string;
        name: string;
      }>;

      const contentRange =
        databaseResponse.headers.get("Content-Range") ?? "";
      const total = Number(contentRange.split("/").pop());

      if (
        !Array.isArray(guests) ||
        guests.length === 0 ||
        !Number.isSafeInteger(total) ||
        total < 1
      ) {
        return jsonResponse(
          { error: "not_found" },
          404,
        );
      }

      const guest = guests[0];

      return jsonResponse(
        {
          position,
          total,
          guest: {
            code: guest.code.trim(),
            name: guest.name.trim(),
          },
        },
        200,
      );
    }
    catch {
      return jsonResponse(
        { error: "service_unavailable" },
        500,
      );
    }
  },
);
