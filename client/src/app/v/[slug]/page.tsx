import PublicShowcaseClient from "@/components/Showcase/PublicShowcaseClient";

export default function ShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
    return <PublicShowcaseClient params={params} />;
}
