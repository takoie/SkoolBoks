import { useState } from "react";
import ClassListOverview from "./classlist/ClassListOverview";
import ClassListEditor from "./classlist/ClassListEditor";

function ClassList() {
  const [editingId, setEditingId] = useState(null);

  if (editingId) {
    return (
      <ClassListEditor classId={editingId} onBack={() => setEditingId(null)} />
    );
  }

  return <ClassListOverview onEdit={setEditingId} />;
}

export default ClassList;
