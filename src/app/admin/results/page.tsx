
import { getResults } from "@/services/resultsService";
import { AdminResultsView } from "./_components/AdminResultsView";
import type { TestResult } from "@/services/resultsService";

export default async function AdminResultsPage() {
    const results: TestResult[] = await getResults();
    
    return <AdminResultsView initialResults={results} />;
}
