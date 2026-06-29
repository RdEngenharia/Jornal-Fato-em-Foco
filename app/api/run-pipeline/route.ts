import { NextResponse } from "next/server";

const GITHUB_OWNER = "RdEngenharia";
const GITHUB_REPO = "Jornal-Fato-em-Foco";
const WORKFLOW_FILE = "pipeline.yml";

export async function POST() {
  const token = process.env.GITHUB_DISPATCH_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_DISPATCH_TOKEN não configurado no servidor." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ ok: true });
    }

    const errorText = await res.text();
    return NextResponse.json(
      { error: `GitHub retornou erro: ${res.status} ${errorText}` },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}
