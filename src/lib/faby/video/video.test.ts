import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  VideoInputAgent,
  VideoScriptAgent,
  VideoStoryboardAgent,
  VideoAssetAgent,
  VideoVoiceAgent,
  VideoCaptionAgent,
  VideoQualityAgent,
  VideoExportAgent,
  VideoPipelineOrchestrator,
} from "./VideoPipeline";

describe("Motor Real de Vídeo (Pipeline 9 Agentes - VideoMaker)", () => {
  test("1. VideoInputAgent: sanitiza parâmetros e inicia projeto com status planning", () => {
    const project = VideoInputAgent.processInput({
      userId: "user-123",
      prompt: "Explique como funciona a computação quântica",
      aspectRatio: "16:9",
      durationSeconds: 15,
    });

    assert.equal(project.userId, "user-123");
    assert.equal(project.aspectRatio, "16:9");
    assert.equal(project.durationSeconds, 15);
    assert.equal(project.status, "planning");
    assert.equal(project.currentStep, "planejando");
    assert.ok(project.title.length > 0);
  });

  test("2. VideoScriptAgent: gera roteiro estruturado com cenas coerentes", async () => {
    const project = VideoInputAgent.processInput({
      userId: "user-123",
      prompt: "História dos computadores",
      durationSeconds: 15,
    });

    const script = await VideoScriptAgent.generateScript(project);
    assert.ok(script.scenes.length >= 3);
    assert.ok(script.scenes[0].narration.length > 0);
    assert.ok(script.scenes[0].caption.length > 0);
    assert.ok(script.scenes[0].visualPrompt.length > 0);
  });

  test("3. VideoStoryboardAgent: transforma roteiro em cenas de storyboard", async () => {
    const project = VideoInputAgent.processInput({
      userId: "user-123",
      prompt: "Inteligência Artificial",
      durationSeconds: 15,
    });

    const script = await VideoScriptAgent.generateScript(project);
    const scenes = VideoStoryboardAgent.buildStoryboard(script);

    assert.equal(scenes.length, script.scenes.length);
    assert.equal(scenes[0].status, "pending");
  });

  test("4. VideoAssetAgent: gera ativos visuais SVG HD em conformidade com aspecto", async () => {
    const project = VideoInputAgent.processInput({
      userId: "user-123",
      prompt: "Design de Interfaces",
      aspectRatio: "9:16",
    });

    const script = await VideoScriptAgent.generateScript(project);
    const scenes = VideoStoryboardAgent.buildStoryboard(script);
    const readyScenes = await VideoAssetAgent.prepareSceneAssets(scenes, project);

    assert.equal(readyScenes.length, scenes.length);
    assert.ok(readyScenes[0].imageUrl?.startsWith("data:image/svg+xml"));
    assert.equal(readyScenes[0].status, "ready");
  });

  test("5. VideoVoiceAgent & CaptionAgent: gera metadados de voz e legendas VTT", async () => {
    const project = VideoInputAgent.processInput({
      userId: "user-123",
      prompt: "Exploração Espacial",
    });

    const script = await VideoScriptAgent.generateScript(project);
    const scenes = VideoStoryboardAgent.buildStoryboard(script);

    const voiceMeta = VideoVoiceAgent.generateVoiceSynthesisMeta(scenes[0]);
    assert.ok(voiceMeta.estimatedDurationSeconds > 0);

    const vtt = VideoCaptionAgent.generateSubtitlesVtt(scenes);
    assert.ok(vtt.startsWith("WEBVTT"));
    assert.match(vtt, /-->/);
  });

  test("6. VideoQualityAgent: rejeita blob vazio e valida vídeo com conteúdo real", () => {
    const project = VideoInputAgent.processInput({
      userId: "user-123",
      prompt: "Teste de Qualidade",
    });

    const emptyBlob = new Blob([], { type: "video/webm" });
    const checkEmpty = VideoQualityAgent.validate(emptyBlob, project);
    assert.equal(checkEmpty.valid, false);

    const validBlob = new Blob(["conteúdo real de vídeo em bytes"], { type: "video/webm" });
    const checkValid = VideoQualityAgent.validate(validBlob, project);
    assert.equal(checkValid.valid, true);
    assert.ok(checkValid.sizeBytes > 0);
  });

  test("7. VideoPipelineOrchestrator: orquestra pipeline de ponta a ponta", async () => {
    let lastProgress = 0;
    const project = await VideoPipelineOrchestrator.executeFullPipeline({
      userId: "user-123",
      prompt: "Como criar uma startup em 2026",
      durationSeconds: 15,
      onProgress: (p) => {
        lastProgress = p;
      },
    });

    assert.equal(project.status, "completed");
    assert.equal(project.currentStep, "concluido");
    assert.equal(lastProgress, 100);
    assert.ok(project.scenes.length >= 3);
    assert.ok(project.logs.length >= 4);
  });
});
