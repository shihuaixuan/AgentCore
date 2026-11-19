// The team picture is laid out on a 600-unit-wide, 396px-tall stage that stretches to the
// screen's width, while every vertical position is in pixels: the labels
// are text at a fixed size, so the rows keep the room their labels need on a
// phone instead of shrinking with the drawing.
const STAGE_WIDTH = 600;

// Leave space for wrapped titles above the branch connectors.
export const LABEL_GAP = 6;
export const LABEL_HEIGHT = 40;
// Space between a connector and the label above it.
const CONNECTOR_GAP = 8;

export interface TeamMember {
  role: string;
  asset: string;
  /** Centre, in stage units (0-600). */
  x: number;
  /** Top of the picture, in pixels. */
  top: number;
  /** Picture size in pixels on a screen wide enough for the whole stage. */
  size: number;
  parent?: string;
}

export const CONTENT_ROLE = "SEO & Content";
export const SALES_ROLE = "Sales";

// Otto leads three heads of department, and each side of the tree is a team
// whose work belongs together: research and support under marketing,
// operations and security under finance.
export const TEAM: TeamMember[] = [
  { role: "Head of AI", asset: "otto", x: 300, top: 0, size: 88 },
  {
    role: CONTENT_ROLE,
    asset: "maria",
    x: 150,
    top: 128,
    size: 76,
    parent: "otto",
  },
  {
    role: SALES_ROLE,
    asset: "max",
    x: 300,
    top: 128,
    size: 76,
    parent: "otto",
  },
  {
    role: "Finance, Invoicing & Bookkeeping",
    asset: "mina",
    x: 450,
    top: 128,
    size: 76,
    parent: "otto",
  },
  {
    role: "Market & Competitor Intelligence",
    asset: "nadia",
    x: 75,
    top: 282,
    size: 68,
    parent: "maria",
  },
  {
    role: "Customer Success & Retention",
    asset: "riley",
    x: 225,
    top: 282,
    size: 68,
    parent: "maria",
  },
  {
    role: "Ops",
    asset: "frankie",
    x: 375,
    top: 282,
    size: 68,
    parent: "mina",
  },
  {
    role: "Dependency & Security Hygiene",
    asset: "devon",
    x: 525,
    top: 282,
    size: 68,
    parent: "mina",
  },
];

export const TEAM_PARENTS = TEAM.filter((member) =>
  TEAM.some((child) => child.parent === member.asset),
);

export function isLead(member: TeamMember) {
  return !member.parent;
}

// Where a parent's connector starts: under the picture for Otto, whose label
// sits beside him, and under the label for everyone else.
function connectorStart(parent: TeamMember) {
  const bottom = parent.top + parent.size;
  if (isLead(parent)) return bottom + CONNECTOR_GAP;
  return bottom + LABEL_GAP + LABEL_HEIGHT + CONNECTOR_GAP;
}

/** One parent's branch: a stem down from the parent to a bar halfway to
 *  the children, and the bar's drops into each child. Horizontal positions
 *  are stage units, vertical ones pixels at full picture size. */
export function teamBranch(parent: TeamMember) {
  const children = TEAM.filter((member) => member.parent === parent.asset);
  const start = connectorStart(parent);
  const end = Math.min(...children.map((child) => child.top));
  return {
    x: parent.x,
    start,
    end,
    left: children[0].x,
    right: children[children.length - 1].x,
    innerDrops: children.slice(1, -1).map((child) => child.x),
  };
}

export function stagePercent(x: number) {
  return `${(x / STAGE_WIDTH) * 100}%`;
}

/** A picture's rendered size: full size down to a 360px-wide stage, then
 *  shrinking with it so neighbours never touch on the narrowest phones. */
export function fluidSize(size: number) {
  return `min(${size}px, ${size / 3.6}cqw)`;
}

// The order the team arrives in, in seconds: Otto, his branch, the heads of
// department left to right, their branches, then the bottom row.
export function revealDelay(member: TeamMember) {
  if (isLead(member)) return 0.1;
  const row = TEAM.filter((other) => other.top === member.top);
  const rowStart = member.parent === "otto" ? 0.45 : 0.8;
  return rowStart + row.indexOf(member) * 0.07;
}

export function branchDelay(parent: TeamMember) {
  return isLead(parent) ? 0.3 : 0.65;
}
