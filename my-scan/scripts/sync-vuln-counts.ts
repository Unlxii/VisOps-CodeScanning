import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting vulnerability count sync...");

    const scans = await prisma.scanHistory.findMany({
        where: {
            reportJson: {
                not: undefined
            }
        },
        select: {
            id: true,
            pipelineId: true,
            reportJson: true,
            vulnCritical: true,
            vulnHigh: true
        }
    });

    console.log(`Found ${scans.length} scans with reportJson.`);

    for (const scan of scans) {
        if (!scan.reportJson) continue;
        const reportMap: any = scan.reportJson;

        let vulnCritical = 0;
        let vulnHigh = 0;
        let vulnMedium = 0;
        let vulnLow = 0;

        // Parse Trivy
        if (reportMap.trivy && Array.isArray(reportMap.trivy.Results)) {
            reportMap.trivy.Results.forEach((res: any) => {
                if (res.Vulnerabilities) {
                    res.Vulnerabilities.forEach((v: any) => {
                        const sev = (v.Severity || "").toUpperCase();
                        if (sev === "CRITICAL") vulnCritical++;
                        else if (sev === "HIGH") vulnHigh++;
                        else if (sev === "MEDIUM") vulnMedium++;
                        else if (sev === "LOW") vulnLow++;
                    });
                }
            });
        }

        // Parse Semgrep
        if (reportMap.semgrep && Array.isArray(reportMap.semgrep.results)) {
            reportMap.semgrep.results.forEach((issue: any) => {
                const sev = (issue.extra?.severity || "").toUpperCase();
                if (sev === "ERROR") vulnHigh++;
                else if (sev === "WARNING") vulnMedium++;
                else vulnLow++;
            });
        }

        // Parse Gitleaks
        if (reportMap.gitleaks && Array.isArray(reportMap.gitleaks)) {
            vulnCritical += reportMap.gitleaks.length;
        }

        // If counts differ, update
        if (vulnCritical > 0 || vulnHigh > 0 || vulnMedium > 0 || vulnLow > 0) {
            console.log(`Updating scan ${scan.id} (Pipeline ${scan.pipelineId}) -> Critical: ${vulnCritical}, High: ${vulnHigh}`);
            await prisma.scanHistory.update({
                where: { id: scan.id },
                data: {
                    vulnCritical: vulnCritical,
                    vulnHigh: vulnHigh,
                    vulnMedium: vulnMedium,
                    vulnLow: vulnLow,
                }
            });
        }
    }

    console.log("Done syncing vulnerability counts!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
