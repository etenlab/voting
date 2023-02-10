import { gql } from "@apollo/client";

export const electionsQuery = gql`
    query Elections {
        elections {
            id
            app_id
            name
            table_name
            row
            created_by
        }
    }
`;

export const ballotEntryByRowIdQuery = gql`
    query BallotEntryByRowId($row: Float!) {
        ballotEntryByRowId(row: $row) {
            created_by
            election_id
            id
            row
            table_name
        }
    }
`;

export const ballotEntriesQuery = gql`
    query BallotEntries {
        ballotEntries {
            id
            election_id
            table_name
            row
            created_by
        }
    }
`;

export const createElectionMutation = gql`
    mutation createElection($input: ElectionInput!) {
        createElection(input: $input) {
            election {
                app_id
                created_by
                id
                name
            }
        }
    }
`;

export const createBallotEntryMutation = gql`
    mutation createBallotEntryMutation($input: BallotEntryInput!) {
        createBallotEntry(input: $input) {
            ballotEntry {
                created_by
                election_id
                id
                row
                table_name
            }
        }
    }
`;

export const votesQuery = gql`
    query Votes($userId: String) {
        votes(user_id: $userId) {
            ballot_entry_id
            id
            up
            user_id
            ballot_entry {
                row
                election_id
            }
        }
    }
`;

export const createVoteMutation = gql`
    mutation CreateVote($input: VoteInput!) {
        createVote(input: $input) {
            vote {
                ballot_entry_id
                id
                up
                user_id
            }
        }
    }
`;
export const updateVoteMutation = gql`
    mutation UpdateVote($input: UpdateVote!) {
        updateVote(input: $input) {
            id
            up
            user_id
            ballot_entry {
                row
            }
        }
    }
`;

export const deleteVoteMutation = gql`
    mutation Mutation($deleteVoteId: Float!) {
        deleteVote(id: $deleteVoteId)
    }
`;

export const votesStatsQuery = gql`
    query VotesStats($electionId: Float!) {
        votesStats(election_id: $electionId) {
            ballot_entry_id
            row
            down
            up
        }
    }
`;
