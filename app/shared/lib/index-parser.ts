export interface ParsedIndex {
  id: string;
  name: string;
  fields: string[];
  sql: string;
  isUnique: boolean;
}

export function parseIndexes(indexes: string[]): ParsedIndex[] {
  if (!indexes || !Array.isArray(indexes)) {
    return [];
  }

  return indexes.map((indexSql, index) => {
    // Extract index name
    const nameMatch = indexSql.match(/CREATE (?:UNIQUE\s+)?INDEX `([^`]+)`/);
    const name = nameMatch ? nameMatch[1] : `index_${index}`;

    // Check if it's a unique index
    const isUnique = indexSql.toLowerCase().includes("unique");

    // Extract fields from the parentheses
    // This regex looks for content within parentheses after the table name
    const fieldsMatch = indexSql.match(/\(\s*([\s\S]*?)\s*\)$/);

    let fields: string[] = [];
    if (fieldsMatch) {
      const fieldsString = fieldsMatch[1];
      // Split by comma and clean up each field
      fields = fieldsString
        .split(",")
        .map((field) => {
          // Remove backticks, newlines, and extra whitespace
          return field.replace(/`/g, "").replace(/\n/g, "").trim();
        })
        .filter((field) => field.length > 0);
    }

    return {
      id: name,
      name,
      fields,
      sql: indexSql,
      isUnique,
    };
  });
}

// Generate consistent colors for index combinations
export function getIndexColor(indexId: string): string {
  const colors = [
    "#3B82F6", // blue
    "#EF4444", // red
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // purple
    "#F97316", // orange
    "#06B6D4", // cyan
    "#84CC16", // lime
    "#EC4899", // pink
    "#6B7280", // gray
    "#14B8A6", // teal
    "#A855F7", // violet
  ];

  // Create a simple hash from the indexId
  let hash = 0;
  for (let i = 0; i < indexId.length; i++) {
    const char = indexId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return colors[Math.abs(hash) % colors.length];
}

// Get Tailwind CSS classes for colors
export function getIndexColorClasses(indexId: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      "#3B82F6": {
        bg: "bg-blue-500",
        text: "text-blue-700",
        border: "border-blue-500",
      },
      "#EF4444": {
        bg: "bg-red-500",
        text: "text-red-700",
        border: "border-red-500",
      },
      "#10B981": {
        bg: "bg-green-500",
        text: "text-green-700",
        border: "border-green-500",
      },
      "#F59E0B": {
        bg: "bg-amber-500",
        text: "text-amber-700",
        border: "border-amber-500",
      },
      "#8B5CF6": {
        bg: "bg-purple-500",
        text: "text-purple-700",
        border: "border-purple-500",
      },
      "#F97316": {
        bg: "bg-orange-500",
        text: "text-orange-700",
        border: "border-orange-500",
      },
      "#06B6D4": {
        bg: "bg-cyan-500",
        text: "text-cyan-700",
        border: "border-cyan-500",
      },
      "#84CC16": {
        bg: "bg-lime-500",
        text: "text-lime-700",
        border: "border-lime-500",
      },
      "#EC4899": {
        bg: "bg-pink-500",
        text: "text-pink-700",
        border: "border-pink-500",
      },
      "#6B7280": {
        bg: "bg-gray-500",
        text: "text-gray-700",
        border: "border-gray-500",
      },
      "#14B8A6": {
        bg: "bg-teal-500",
        text: "text-teal-700",
        border: "border-teal-500",
      },
      "#A855F7": {
        bg: "bg-violet-500",
        text: "text-violet-700",
        border: "border-violet-500",
      },
    };

  const color = getIndexColor(indexId);
  return (
    colorMap[color] || {
      bg: "bg-gray-500",
      text: "text-gray-700",
      border: "border-gray-500",
    }
  );
}
