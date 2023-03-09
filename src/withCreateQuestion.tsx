import React from "react";
import { useMutation } from "@apollo/client";
import { CrowdBibleUI } from "@eten-lab/ui-kit";
import { ThemeProvider } from "@eten-lab/ui-kit/dist/";
import { createQuestionMutation } from "./graphql/queries";
import { votingClient } from "./graphql/votingCLient";

export interface CreateQuestionProps {
  appId: number;
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}

const withCreateQuestion = () => {
  return (props: CreateQuestionProps) => {
    const { appId, userId, onCancel, onSave } = props;
    const [createQuestion] = useMutation(createQuestionMutation, {
      client: votingClient,
    });

    return (
      <ThemeProvider>
        <CrowdBibleUI.QuestionCreatorBox
          onCancel={onCancel}
          onSave={(question) => {
            createQuestion({
              variables: {
                input: {
                  appId: appId,
                  userId: userId,
                  type: question.type,
                  text: question.question,
                  answers: question.answers?.map((answer) => {
                    return { text: answer };
                  }),
                },
              },
            });
            
            return onSave;
          }}
        />
      </ThemeProvider>
    );
  };
};

export default withCreateQuestion;
