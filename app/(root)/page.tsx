import { startNewChat } from "@/features/home/actions/start-new-chat-action";
import { redirect } from "next/navigation";

const Page = async () => {
  const conversationId = await startNewChat();


  redirect(`/c/${conversationId}`)
  return (
    <div>
      <h1>HEllo WOlrds</h1>
    </div>
  );
}

export default Page;
