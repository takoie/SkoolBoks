import { Pencil, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function StoryList({ onOpen }) {
  const stories = useAppStore((s) => s.adjectiveStories);
  const createAdjectiveStory = useAppStore((s) => s.createAdjectiveStory);
  const deleteAdjectiveStory = useAppStore((s) => s.deleteAdjectiveStory);

  const list = Object.values(stories).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  function handleNewStory() {
    const title = `Historie ${list.length + 1}`;
    const id = createAdjectiveStory(title);
    onOpen(id);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Adjektivfortelling
        </h2>
        <button
          type="button"
          onClick={handleNewStory}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny historie
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen historier laget ennå. Klikk «Ny historie» for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((story) => (
            <li
              key={story.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <p className="font-heading text-xl font-semibold text-ink">
                {story.title}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(story.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Pencil size={18} aria-hidden="true" />
                  Åpne
                </button>
                <button
                  type="button"
                  onClick={() => deleteAdjectiveStory(story.id)}
                  aria-label={`Slett ${story.title}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StoryList;
