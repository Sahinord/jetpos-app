import PublicShowcaseClient from "@/components/Showcase/PublicShowcaseClient";

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    return [{ slug: 'demo' }];
}

export default function ShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
    return <PublicShowcaseClient params={params} />;
}
