"use client";

import { useState } from "react";
import {
  addChatToGroups,
  ChatHeader,
  ChatInterface,
  initialChatGroups,
  initialConnectors,
  Sidebar,
  type ChatGroup,
  type Connector,
  type PinnedMessage,
  type User,
} from "@/components/chat";
import { useUIStore, useInitUIStore } from "@/store/uiStore";
import { useUserInfoStore } from "@/store/userInfoStore";

export default function DashboardPage() {
  useInitUIStore();
  const { darkMode } = useUIStore();
  const { fullName, username, email: userEmail } = useUserInfoStore();
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedChat, setSelectedChat] = useState("Debounce in TypeScript");

  const [chatGroups, setChatGroups] = useState<ChatGroup[]>(initialChatGroups);

  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);

  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([
    { id: 1, title: "Debounce in TypeScript" },
  ]);

  const [memory, setMemory] = useState("");

  const user: User = {
    name: fullName?.trim() || username?.trim() || "alex",
    email: userEmail?.trim() || "alex@zuri.chat",
  };

  function newChat() {
    const title = `New chat ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    setSelectedChat(title);
    setChatGroups((prev) => addChatToGroups(prev, title));
  }

  function selectChat(title: string) {
    setSelectedChat(title);
  }

  function handleReload() {
    setReloadKey((k) => k + 1);
  }

  function pinMessage(title: string) {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setPinnedMessages((prev) => [
      { id: Date.now(), title: cleanTitle },
      ...prev.filter((item) => item.title !== cleanTitle),
    ]);
  }

  const themeClass = darkMode ? "D dark" : "L";

  return (
    <div className={`app ${themeClass}`}>
      <Sidebar
        user={user}
        onNewChat={newChat}
        onSelectChat={selectChat}
        selectedChat={selectedChat}
        chatGroups={chatGroups}
        setChatGroups={setChatGroups}
        connectors={connectors}
        setConnectors={setConnectors}
        pinnedMessages={pinnedMessages}
        setPinnedMessages={setPinnedMessages}
        memory={memory}
        setMemory={setMemory}
      />

      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Top Header with big chat topic on the left and reload button on the right */}
        <ChatHeader
          selectedChat={selectedChat}
          darkMode={darkMode}
          onReload={handleReload}
          onNewChat={newChat}
          className="pt-3.5 pb-2.5 sm:pt-4 sm:pb-3"
        />

        {/* Main chat interface */}
        <ChatInterface
          key={`${selectedChat}-${reloadKey}`}
          selectedChat={selectedChat}
          darkMode={darkMode}
          onPinMessage={pinMessage}
          userName={user.name}
        />
      </div>
    </div>
  );
}
