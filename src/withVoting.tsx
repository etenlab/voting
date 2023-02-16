import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import React, { ComponentType, useState, useEffect, useMemo } from "react";
import { Button, Divider, IconButton, Stack, Typography } from "@mui/material";
import { FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { votingClient } from "./graphql/votingCLient";
import { keyBy } from "lodash";
import {
  ballotEntriesQuery,
  ballotEntryByRowIdQuery,
  createBallotEntryMutation,
  createElectionMutation,
  createVoteMutation,
  deleteVoteMutation,
  electionsQuery,
  updateVoteMutation,
  votesQuery,
  votesStatsQuery,
} from "./graphql/queries";

export interface IElection {
  id: number;
  app_id: number;
  name: string;
  table_name: string;
  row: number;
  created_by: string;
}

export interface IBallotEntry {
  id: number;
  row: number;
  table_name: string;
  created_by: string;
  election_id: number;
  BallotEntry: ComponentType;
}

export interface IVote {
  id: number;
  ballot_entry: IBallotEntry;
  up: boolean;
  user_id: string;
}

export interface VotingProps {
  electionProps: {
    appId: number;
    tableName: string;
    row: number;
    name: string;
    displayElection?: boolean;
  };
  ballotEntriesProps: {
    tableName: string;
    row: number;
  }[];
  direction: "row" | "column-reverse";
  userId?: string;
}

const withVoting = (
  Election: ComponentType,
  BallotEntries: ComponentType[]
) => {
  return (props: VotingProps) => {
    const [election, setElection] = useState<IElection | null>(null);
    const [ballotEntries, setBallotEntries] = useState<IBallotEntry[] | null>(
      null
    );

    const { data: electionsData, loading: loadignElections } = useQuery(
      electionsQuery,
      { client: votingClient }
    );

    const { data: ballotEntriesData, loading: loadingBallotEntries } = useQuery(
      ballotEntriesQuery,
      { client: votingClient }
    );

    const { data: votesData, loading: loadingVotes } = useQuery(votesQuery, {
      client: votingClient,
      variables: { userId: props.userId },
    });

    const { data: votesStatsData, loading: loadingVotesStats } = useQuery(
      votesStatsQuery,
      {
        skip: !Boolean(election?.id),
        client: votingClient,
        variables: { electionId: election?.id },
      }
    );

    const [getBallotEntry] = useLazyQuery(ballotEntryByRowIdQuery, {
      client: votingClient,
    });

    const [createElection] = useMutation(createElectionMutation, {
      client: votingClient,
    });

    const [createBallotEntry] = useMutation(createBallotEntryMutation, {
      client: votingClient,
    });

    const [createVote] = useMutation(createVoteMutation, {
      client: votingClient,
    });

    const [updateVote] = useMutation(updateVoteMutation, {
      client: votingClient,
    });

    const [deleteVote] = useMutation(deleteVoteMutation, {
      client: votingClient,
    });

    const votes = useMemo(() => votesData?.votes, [votesData]);

    const votesStats = useMemo(
      () => keyBy(votesStatsData?.votesStats, "ballot_entry_id"),
      [votesStatsData]
    );

    const allFetched = useMemo(
      () =>
        !loadingBallotEntries &&
        !loadignElections &&
        !loadingVotes &&
        !loadingVotesStats,
      [loadignElections, loadingBallotEntries, loadingVotes, loadingVotesStats]
    );

    useEffect(() => {
      async function fetchElection() {
        if (electionsData) {
          let electionProxy = electionsData?.elections.find(
            (election: { name: string }) =>
              election.name === props.electionProps.name
          );

          if (electionProxy) return setElection(electionProxy);

          electionProxy = await createElection({
            variables: {
              input: {
                app_id: props.electionProps.appId,
                name: props.electionProps.name,
                created_by: props.userId ?? "userId",
                table_name: props.electionProps.tableName,
                row: props.electionProps.row,
              },
            },
          });

          setElection(electionProxy.data.createElection.election);
        }
      }

      fetchElection();
    }, [createElection, electionsData, props.electionProps, props.userId]);

    useEffect(() => {
      async function mergeBallotEntries() {
        if (ballotEntriesData && props.ballotEntriesProps && election) {
          const ballotEntriesProxy = props.ballotEntriesProps.map(
            async (ballotEntry, idx) => {
              const found = ballotEntriesData?.ballotEntries.find(
                (be: IBallotEntry) =>
                  be.table_name === ballotEntry.tableName &&
                  be.row === ballotEntry.row &&
                  be.election_id === election.id
              );

              if (found) {
                return {
                  ...found,
                  BallotEntry: BallotEntries[idx],
                };
              }

              const mergedBallotEntry = await createBallotEntry({
                variables: {
                  input: {
                    table_name: ballotEntry.tableName,
                    row: ballotEntry.row,
                    election_id: election.id,
                    created_by: props.userId ?? "userId",
                  },
                },
              });

              return {
                ...mergedBallotEntry.data.createBallotEntry.ballotEntry,
                BallotEntry: BallotEntries[idx],
              };
            }
          );

          setBallotEntries(await Promise.all(ballotEntriesProxy));
        }
      }

      mergeBallotEntries();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ballotEntriesData, election]);

    const handleVote = async (up: boolean, id?: number) => {
      const { data: ballotEntry } = await getBallotEntry({
        variables: {
          row: id,
        },
      });

      const row = votes?.find(
        (vote: IVote) =>
          vote.ballot_entry.row === id && vote.user_id === props.userId
      );

      if (row) {
        if (row.up === up)
          return deleteVote({
            variables: { deleteVoteId: row.id },
            refetchQueries: [votesQuery, votesStatsQuery],
          });

        return updateVote({
          variables: {
            input: {
              up: up,
              vote_id: row.id,
              user_id: props.userId,
            },
          },
          refetchQueries: [
            {
              query: votesStatsQuery,
              variables: { electionId: election?.id },
            },
          ],
        });
      }

      return createVote({
        variables: {
          input: {
            up: up,
            user_id: props.userId,
            ballot_entry_id: ballotEntry?.ballotEntryByRowId.id,
          },
        },
        refetchQueries: [
          { query: votesQuery, variables: { userId: props.userId } },
          {
            query: votesStatsQuery,
            variables: { electionId: election?.id },
          },
        ],
        update: (cache, result) => {
          const cached = cache.readQuery({
            query: votesQuery,
            returnPartialData: true,
            variables: {
              userId: props.userId,
            },
          });
          cache.writeQuery({
            query: votesQuery,
            variables: {
              userId: props.userId,
            },
            data: {
              //@ts-expect-error
              ...cached,
              votes: [
                {
                  ...result.data.createVote.vote,
                  ballot_entry: {
                    row: ballotEntry?.ballotEntryByRowId.row,
                    election_id: election?.id,
                  },
                },
              ],
            },
          });
        },
      });
    };

    return (
      <Stack spacing={4} divider={<Divider orientation="horizontal" />}>
        {election && allFetched && props.electionProps.displayElection && (
          <Election />
        )}
        {allFetched &&
          ballotEntries?.map((ballotEntry, idx) => {
            let fill = null;
            let voteStat = null;
            if (votes?.length) {
              fill = votes?.find((vote: IVote) => {
                return (
                  vote?.ballot_entry.election_id === election?.id &&
                  vote.ballot_entry.row === ballotEntry.row &&
                  vote.user_id === props.userId
                );
              });
            }

            if (votesStats) voteStat = votesStats[ballotEntry.id];

            return (
              <Stack
                direction={props.direction}
                spacing={props.direction === "row" ? 4 : 1}
                alignItems={props.direction === "row" ? "center" : undefined}
                key={idx}
              >
                <Stack direction="row" spacing={2}>
                  <Button
                    sx={{
                      backgroundColor: "#DAF2EA",
                      width: "51px",
                      height: "24px",
                      borderRadius: "4px",
                    }}
                    onClick={() => {
                      handleVote(true, ballotEntry.row);
                    }}
                  >
                    <IconButton color="success" sx={{ fontSize: "14px" }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FiThumbsUp fill={fill?.up ? "#43C888" : "none"} />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {voteStat?.up ?? 0}
                        </Typography>
                      </Stack>
                    </IconButton>
                  </Button>
                  <Button
                    sx={{
                      backgroundColor: "#FFE4E4",
                      width: "51px",
                      height: "24px",
                      borderRadius: "4px",
                    }}
                    onClick={() => {
                      handleVote(false, ballotEntry.row);
                    }}
                  >
                    <IconButton color="error" sx={{ fontSize: "14px" }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FiThumbsDown
                          fill={
                            fill != null && fill.up === false
                              ? "#D44C4C"
                              : "none"
                          }
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {voteStat?.down ?? 0}
                        </Typography>
                      </Stack>
                    </IconButton>
                  </Button>
                </Stack>
                <ballotEntry.BallotEntry />
              </Stack>
            );
          })}
      </Stack>
    );
  };
};

export default withVoting;
