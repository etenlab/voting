import React, { useMemo } from "react";
import { CrowdBibleUI } from "@eten-lab/ui-kit";
import { ThemeProvider } from "@eten-lab/ui-kit/dist/";
import { useMutation, useQuery } from "@apollo/client";
import { votingClient } from "./graphql/votingCLient";
import { questionQuery, submitAnswerMutation } from "./graphql/queries";

type QuestionType =
  | "Normal"
  | "Agree/Disagree"
  | "True/False"
  | "Multiselect"
  | "Choose One";

export interface Question {
  text: string;
  type: QuestionType;
  answers: {
    text?: string;
    feedback?: string;
  }[];
}

export interface SubmitQuestionProps {
  questionId: number;
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}

const withSubmitQuestion = () => {
  return (props: SubmitQuestionProps) => {
    const { questionId, userId, onCancel, onSave } = props;

    const { data } = useQuery(questionQuery, {
      variables: { questionId: questionId },
      client: votingClient,
    });

    const [submitAnswer] = useMutation(submitAnswerMutation, {
      client: votingClient,
    });

    const questionData = useMemo(() => data?.question as Question, [data]);

    const answers = questionData?.answers.some((answer) => answer.text)
      ? questionData?.answers.map((answer) => answer.text!)
      : undefined;

    if (!questionData) return <></>;

    return (
      <ThemeProvider>
        <CrowdBibleUI.QuestionBox
          question={questionData.text}
          questionKind={questionData.type as QuestionType}
          questionData={answers}
          onCancel={onCancel}
          onSave={({
            agreeOrDisagree,
            trueOrFalse,
            multiselect,
            chooseOne,
            normal,
          }) => {
            let answers = null;
            if (agreeOrDisagree || trueOrFalse) answers = null;
            if (chooseOne || normal) answers = [{ text: chooseOne ?? normal }];
            if (multiselect) {
              answers = multiselect
                .filter((answer) => answer.checked)
                .map((answer) => {
                  return { text: answer.item };
                });
            }

            submitAnswer({
              variables: {
                input: {
                  userId,
                  questionId,
                  answersInput: answers,
                  type: questionData.type,
                  up: agreeOrDisagree ?? trueOrFalse ?? true,
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

export default withSubmitQuestion;
