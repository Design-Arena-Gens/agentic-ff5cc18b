"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const radiusOptions = [
  { label: "0.5 km", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

const formatTypes = (types) =>
  Array.isArray(types)
    ? types
        .map((type) =>
          type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        )
        .join(", ")
    : "—";

const extractPhone = (place) =>
  place?.formatted_phone_number || place?.international_phone_number || "";

const buildMapsLink = (place) => {
  if (!place?.place_id) return null;
  return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
};

export default function Home() {
  const [form, setForm] = useState({
    query: "",
    location: "",
    radius: radiusOptions[1].value,
  });
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ loading: false, message: "" });
  const [nextPageToken, setNextPageToken] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!status.loading && status.message) {
      const timeout = setTimeout(() => {
        setStatus((prev) => ({ ...prev, message: "" }));
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [status.loading, status.message]);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setStatus({ loading: true, message: "" });
      setResults([]);
      setNextPageToken(null);

      try {
        const response = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: form.query,
            location: form.location,
            radius: Number(form.radius),
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.error || "Failed to fetch results.");
        }

        const payload = await response.json();
        setResults(payload.results);
        setNextPageToken(payload.nextPageToken);

        setHistory((prev) => [
          {
            query: form.query,
            location: form.location,
            radius: Number(form.radius),
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 4),
        ]);
      } catch (error) {
        setStatus({
          loading: false,
          message: error.message || "Unexpected error occurred.",
        });
        return;
      }

      setStatus({
        loading: false,
        message: "",
      });
    },
    [form]
  );

  const fetchNextPage = useCallback(async () => {
    if (!nextPageToken) return;
    setStatus({ loading: true, message: "" });

    try {
      const params = new URLSearchParams({
        pageToken: nextPageToken,
        query: form.query,
      });

      if (form.location) {
        params.set("location", form.location);
        params.set("radius", String(form.radius));
      }

      const response = await fetch(`/api/places?${params.toString()}`);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || "Failed to fetch next page.");
      }

      const payload = await response.json();
      setResults((prev) => [...prev, ...payload.results]);
      setNextPageToken(payload.nextPageToken);
    } catch (error) {
      setStatus({
        loading: false,
        message: error.message || "Unexpected error occurred.",
      });
      return;
    }

    setStatus({ loading: false, message: "" });
  }, [form.location, form.query, form.radius, nextPageToken]);

  const disableSubmit = useMemo(
    () => status.loading || form.query.trim().length === 0,
    [status.loading, form.query]
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8">
          <h1 className="text-3xl font-semibold text-slate-900">
            Google Business Explorer
          </h1>
          <p className="text-sm text-slate-600">
            Discover businesses from Google Places. Provide a search query and
            optional coordinates to narrow results. Results can be exported from
            your browser.
          </p>
        </div>
      </header>

      <main className="mx-auto mt-8 flex max-w-5xl flex-col gap-8 px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 sm:grid-cols-3 sm:items-end"
          >
            <label className="flex flex-col gap-2 sm:col-span-3">
              <span className="text-sm font-medium text-slate-700">
                Search query
              </span>
              <input
                name="query"
                value={form.query}
                onChange={handleInputChange}
                placeholder="e.g. coffee shops in Seattle"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                Location (lat,lng)
              </span>
              <input
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder="Optional: 47.6062,-122.3321"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Radius</span>
              <select
                name="radius"
                value={form.radius}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                {radiusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:col-span-3">
              <button
                type="submit"
                disabled={disableSubmit}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {status.loading ? "Searching…" : "Search Businesses"}
              </button>
              {nextPageToken && (
                <button
                  type="button"
                  onClick={fetchNextPage}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {status.loading ? "Loading…" : "Load More"}
                </button>
              )}
            </div>

            {status.message && (
              <p className="sm:col-span-3 text-sm font-medium text-red-600">
                {status.message}
              </p>
            )}
          </form>
        </section>

        {history.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent searches
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {history.map((item, index) => (
                <li
                  key={`${item.timestamp}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium text-slate-800">
                    {item.query}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Results ({results.length})
              </h2>
              <p className="text-sm text-slate-600">
                Click a business name to open the map listing in a new tab.
              </p>
            </div>
            {results.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const csvHeader = [
                    "Name",
                    "Formatted Address",
                    "Phone",
                    "Rating",
                    "User Ratings Total",
                    "Types",
                    "Maps URL",
                  ];
                  const csvRows = results.map((place) => {
                    const phone = extractPhone(place);
                    const row = [
                      place.name || "",
                      place.formatted_address || "",
                      phone,
                      place.rating ?? "",
                      place.user_ratings_total ?? "",
                      formatTypes(place.types),
                      buildMapsLink(place) || "",
                    ];
                    return row
                      .map((value) => {
                        const stringValue = `${value ?? ""}`.replace(/"/g, '""');
                        return `"${stringValue}"`;
                      })
                      .join(",");
                  });
                  const blob = new Blob(
                    [csvHeader.join(","), ...csvRows].join("\n"),
                    {
                      type: "text/csv;charset=utf-8;",
                    }
                  );
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "google-business-results.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Export CSV
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            {results.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No businesses yet. Run a search to load results.
              </div>
            )}

            {results.map((place) => {
              const mapLink = buildMapsLink(place);
              const phoneNumber = extractPhone(place);
              return (
                <article
                  key={place.place_id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {mapLink ? (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {place.name}
                        </a>
                      ) : (
                        place.name
                      )}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {place.formatted_address || "Address unavailable"}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Types:</span>{" "}
                      {formatTypes(place.types)}
                    </p>
                    {place.opening_hours?.open_now !== undefined && (
                      <p className="text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            place.opening_hours.open_now
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {place.opening_hours.open_now ? "Open now" : "Closed"}
                        </span>
                      </p>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:w-56">
                    <div>
                      <dt className="font-medium text-slate-700">Rating</dt>
                      <dd>{place.rating ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-700">
                        Review count
                      </dt>
                      <dd>{place.user_ratings_total ?? "—"}</dd>
                    </div>
                    {phoneNumber && (
                      <div>
                        <dt className="font-medium text-slate-700">Phone</dt>
                        <dd>{phoneNumber}</dd>
                      </div>
                    )}
                    {place.price_level !== undefined && (
                      <div>
                        <dt className="font-medium text-slate-700">Price</dt>
                        <dd>
                          {place.price_level === 0
                            ? "Free"
                            : "$".repeat(place.price_level)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
