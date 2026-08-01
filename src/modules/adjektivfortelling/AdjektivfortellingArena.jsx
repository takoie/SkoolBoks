import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import StoryList from "./StoryList";
import StoryEditor from "./StoryEditor";
import CollectView from "./CollectView";
import RevealView from "./RevealView";

function AdjektivfortellingArena() {
  const [view, setView] = useState({ mode: "list" });
  const stories = useAppStore((s) => s.adjectiveStories);

  if (view.mode === "editor") {
    return (
      <StoryEditor
        storyId={view.storyId}
        onBack={() => setView({ mode: "list" })}
        onCollect={() => setView({ mode: "collect", storyId: view.storyId })}
      />
    );
  }

  if (view.mode === "collect") {
    const story = stories[view.storyId];
    if (!story) return null;
    return (
      <CollectView
        story={story}
        onBack={() => setView({ mode: "editor", storyId: view.storyId })}
        onComplete={(answers) =>
          setView({ mode: "reveal", storyId: view.storyId, answers })
        }
      />
    );
  }

  if (view.mode === "reveal") {
    const story = stories[view.storyId];
    if (!story) return null;
    return (
      <RevealView
        story={story}
        answers={view.answers}
        onBack={() => setView({ mode: "editor", storyId: view.storyId })}
      />
    );
  }

  return <StoryList onOpen={(storyId) => setView({ mode: "editor", storyId })} />;
}

export default AdjektivfortellingArena;
