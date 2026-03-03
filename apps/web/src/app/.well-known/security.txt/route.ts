export function GET() {
  const body = `Contact: mailto:hello@pricetoken.ai
Contact: https://github.com/nichochar/pricetoken/security/advisories
Expires: 2027-03-04T00:00:00.000Z
Preferred-Languages: en
Canonical: https://pricetoken.ai/.well-known/security.txt
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
