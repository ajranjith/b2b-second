const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
const adminUrl = `${baseUrl}/api/bff/v1/admin/banners`;
const dealerUrl = `${baseUrl}/api/bff/v1/dealer/banners`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const now = Date.now();
  const payload = {
    mediaUrl: `https://example.com/banner-${now}.jpg`,
    title: `Lag Test ${now}`,
    subtitle: "Replication lag probe",
    mediaType: "image",
    isActive: true,
  };

  const createResponse = await fetch(adminUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dev-role": "ADMIN",
    },
    body: JSON.stringify(payload),
  });

  if (!createResponse.ok) {
    const body = await createResponse.text();
    console.error("FAIL: admin banner create failed.");
    console.error(body);
    process.exitCode = 1;
    return;
  }

  const created = await createResponse.json();
  const bannerId = created?.data?.banner?.id ?? created?.banner?.id ?? created?.id;
  if (!bannerId) {
    console.error("FAIL: banner create did not return an id.");
    process.exitCode = 1;
    return;
  }

  const start = Date.now();
  let found = false;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const dealerResponse = await fetch(dealerUrl, {
      headers: {
        "x-dev-role": "DEALER",
      },
    });

    if (!dealerResponse.ok) {
      const body = await dealerResponse.text();
      console.error("FAIL: dealer banner fetch failed.");
      console.error(body);
      process.exitCode = 1;
      return;
    }

    const dealerData = await dealerResponse.json();
    const banners = dealerData?.data?.banners ?? dealerData?.banners ?? [];
    found = banners.some((banner: any) => banner.id === bannerId);
    if (found) {
      const delayMs = Date.now() - start;
      console.log(`PASS: banner visible to dealer after ${delayMs} ms.`);
      return;
    }

    await sleep(1000);
  }

  console.error("FAIL: banner did not appear in dealer feed within 30 seconds.");
  process.exitCode = 1;
}

run().catch((error) => {
  console.error("FAIL: unexpected error during lag test.");
  console.error(error);
  process.exitCode = 1;
});
