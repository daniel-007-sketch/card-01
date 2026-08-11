const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "method_not_allowed" },
        405,
      );
    }

    let body: unknown;

    try {
      body =
        await request.json();
    }
    catch {
      return jsonResponse(
        { error: "invalid_request" },
        400,
      );
    }

    const code =
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    if (!/^[0-9]{3}$/.test(code)) {
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

      const lookupUrl =
        new URL(
          `${supabaseUrl}/rest/v1/invitation_guests`,
        );

      lookupUrl.searchParams.set(
        "code",
        `eq.${code}`,
      );

      lookupUrl.searchParams.set(
        "select",
        "name,guest_limit",
      );

      lookupUrl.searchParams.set(
        "limit",
        "1",
      );

      const databaseResponse =
        await fetch(
          lookupUrl,
          {
            headers: {
              "Accept": "application/json",
              "apikey": getSecretKey(),
            },
          },
        );

      if (!databaseResponse.ok) {
        throw new Error(
          "Guest lookup failed.",
        );
      }

      const guests =
        await databaseResponse.json() as Array<{
          name: string;
          guest_limit: number;
        }>;

      if (
        !Array.isArray(guests) ||
        guests.length === 0
      ) {
        return jsonResponse(
          { error: "not_found" },
          404,
        );
      }

      const name =
        guests[0].name.trim();

      const guestLimit =
        guests[0].guest_limit;

      if (
        name === "" ||
        !Number.isSafeInteger(guestLimit) ||
        guestLimit < 1
      ) {
        throw new Error(
          "Guest data is invalid.",
        );
      }

      return jsonResponse(
        {
          guestName: name,
          guestLimit,
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
