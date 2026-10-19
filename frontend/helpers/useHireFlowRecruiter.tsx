import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecruiterCandidates } from "../endpoints/recruiter/candidates_GET.schema";
import { getRecruiterStats } from "../endpoints/recruiter/stats_GET.schema";
import { getRecruiterCandidate } from "../endpoints/recruiter/candidate_GET.schema";
import { postRecruiterReview } from "../endpoints/recruiter/review_POST.schema";

export const recruiterKeys = {
  root: ["hireflow", "recruiter"] as const,
  stats: ["hireflow", "recruiter", "stats"] as const,
  candidates: ["hireflow", "recruiter", "candidates"] as const,
  activity: ["hireflow", "recruiter", "activity"] as const,
  candidate: (applicationId: string) => ["hireflow", "recruiter", "candidate", applicationId] as const,
};

export function useRecruiterStats() {
  return useQuery({ queryKey: recruiterKeys.stats, queryFn: getRecruiterStats });
}

export function useRecruiterCandidates(enabled = true) {
  return useQuery({ queryKey: recruiterKeys.candidates, queryFn: getRecruiterCandidates, enabled });
}

export function useRecruiterCandidate(applicationId: string) {
  return useQuery({
    queryKey: recruiterKeys.candidate(applicationId),
    queryFn: () => getRecruiterCandidate({ applicationId }),
    enabled: Boolean(applicationId),
  });
}

export function useRecruiterReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: postRecruiterReview,
    onSuccess: (_data, variables) => {
      void client.invalidateQueries({ queryKey: recruiterKeys.stats });
      void client.invalidateQueries({ queryKey: recruiterKeys.candidates });
      void client.invalidateQueries({ queryKey: recruiterKeys.candidate(variables.applicationId) });
      void client.invalidateQueries({ queryKey: recruiterKeys.activity });
    },
  });
}
