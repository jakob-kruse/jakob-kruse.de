export const COLOR_PALETTE = [
	"#FF6384",
	"#36A2EB",
	"#FFCE56",
	"#4BC0C0",
	"#9966FF",
	"#FF9F40",
	"#FFCD56",
	"#FFD700",
	"#32CD32",
	"#4169E1",
	"#FFA07A",
	"#BA55D3",
	"#20B2AA",
	"#FF4500",
	"#DA70D6",
	"#7FFFD4",
	"#87CEEB",
	"#FFDAB9",
	"#FA8072",
	"#6A5ACD",
];

export function genColor() {
	return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}
