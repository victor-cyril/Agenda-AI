import React from "react";
import { MeetingGetOne } from "../../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";

import {
  BookOpenTextIcon,
  ClockFadingIcon,
  FileTextIcon,
  FileVideoIcon,
  SparkleIcon,
} from "lucide-react";
import { TabsContent } from "@radix-ui/react-tabs";
import Link from "next/link";
import GeneratedAvatar from "@/components/generated-avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import Transcript from "./transcript";
import { ChatProvider } from "./chat-provider";

type Props = {
  data: MeetingGetOne;
};

const triggerClass = `text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground border-b-2 border-transparent h-full hover:text-accent-foreground`;

const CompletedState = (props: Props) => {
  const { data } = props;

  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        <div className="bg-white rounded-lg px-3">
          <ScrollArea>
            <TabsList className="p-0 space-x-2 bg-background justify-start rounded-none h-13">
              <TabsTrigger value="summary" className={triggerClass}>
                <BookOpenTextIcon />
                Summary
              </TabsTrigger>
              <TabsTrigger value="transcript" className={triggerClass}>
                <FileTextIcon />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="recording" className={triggerClass}>
                <FileVideoIcon />
                Recording
              </TabsTrigger>
              <TabsTrigger value="chat" className={triggerClass}>
                <SparkleIcon />
                Ask AI
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <TabsContent value="summary">
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
              <h2 className="text-2xl font-medium capitalize">{data.name}</h2>
              <div className="flex gap-x-2 items-center">
                <Link
                  href={`/agents/${data.agentId}`}
                  className="flex items-center gap-x-2 underline underline-offset-4 capitalize"
                >
                  <GeneratedAvatar
                    variant="botttsNeutral"
                    seed={data.agent.name}
                    className="size-5"
                  />
                  {data.agent.name}
                </Link>{" "}
                <p className="">
                  {data.startedAt ? format(data.startedAt, "PPP") : "N/A"}{" "}
                </p>
              </div>

              <div className="flex gap-x-2 items-center">
                <SparkleIcon className="size-4" />
                <p>General Summary</p>
              </div>

              <Badge
                variant="outline"
                className="flex items-center gap-x-2 [&>svg]:size-4"
              >
                <ClockFadingIcon className="text-blue-700" />
                {data.duration ? formatDuration(data.duration) : "No duration"}
              </Badge>

              <div className="px-4">
                <Markdown
                  components={{
                    h1: (props) => (
                      <h1 className="text-2xl font-medium mb-6" {...props} />
                    ),
                    h2: (props) => (
                      <h2 className="text-xl font-medium mb-6" {...props} />
                    ),
                    h3: (props) => (
                      <h3 className="text-lg font-medium mb-6" {...props} />
                    ),
                    h4: (props) => (
                      <h4 className="text-base font-medium mb-6" {...props} />
                    ),
                    p: (props) => (
                      <p className="mb-6 leading-relaxed" {...props} />
                    ),
                    ul: (props) => (
                      <ul
                        className="list-disc list-inside ml-6 mb-6"
                        {...props}
                      />
                    ),
                    ol: (props) => (
                      <ol
                        className="list-decimal list-inside ml-6 mb-6"
                        {...props}
                      />
                    ),
                    li: (props) => <li className="mb-2" {...props} />,
                    strong: (props) => (
                      <strong className="font-semibold" {...props} />
                    ),
                    code: (props) => (
                      <code
                        className="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm"
                        {...props}
                      />
                    ),
                    blockquote: (props) => (
                      <blockquote
                        className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4"
                        {...props}
                      />
                    ),
                  }}
                >
                  {data.summary}
                </Markdown>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcript">
          <Transcript meetingId={data.id} />
        </TabsContent>

        {data.recordingUrl && (
          <TabsContent value="recording">
            <div className="bg-white rounded-lg border px-4 py-5">
              <video
                src={data.recordingUrl}
                className="w-full rounded-lg"
                controls
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="chat">
          <ChatProvider meetingId={data.id} meetingName={data.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompletedState;
