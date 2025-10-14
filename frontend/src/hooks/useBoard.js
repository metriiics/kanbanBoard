import { useQuery } from "@tanstack/react-query";
import { boardsApi } from "../api/boardsApi";

export const useBoard = (boardId) => {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => boardsApi.getBoard(boardId),
    staleTime: 1000 * 60, // 1 минута кэша
  });
};
