export interface ParsedSentiment {
  score?: number;
  label?: string;
  positive_ratio?: number;
  neutral_ratio?: number;
  negative_ratio?: number;
}

export interface ParsedVideoMeta {
  id?: string;
  title?: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  duration?: string;
}

export interface ParsedTopic {
  topic: string;
  frequency?: number;
  sentiment?: string;
}

export interface ParsedEngagementMetrics {
  overallScore?: number;
  engagementLevel?: string;
  averageCommentLength?: number;
  averageLikes?: number;
  uniqueAuthors?: number;
  authorDiversity?: number;
}

export interface ParsedPerformanceScore {
  overallScore?: number;
  subScores: Record<string, number>;
  grade?: string;
}

export interface ParsedPersona {
  persona: string;
  percentage?: number;
  characteristics?: string[];
  caresAbout?: string[];
  engagementPattern?: string;
  exampleComments?: string[];
}

export interface ParsedActionPriority {
  action: string;
  priority?: string;
  effort?: string;
  impact?: string;
  reasoning?: string;
}

export interface ParsedTopicMatrixRow {
  topic: string;
  positive?: number;
  neutral?: number;
  negative?: number;
}

export interface ParsedTimelinePoint {
  ts: string;
  value: number;
}

export interface ParsedCommentSample {
  text: string;
  authorName?: string;
  likeCount?: number;
  publishedAt?: string;
}

export interface ParsedAnalysis {
  analysisId?: string;
  completedAt?: string;
  video?: ParsedVideoMeta;
  sentiment?: ParsedSentiment | null;
  sentimentRatios?: { positive?: number; neutral?: number; negative?: number };
  topics: ParsedTopic[];
  topicMatrix: ParsedTopicMatrixRow[];
  engagement?: ParsedEngagementMetrics;
  performance?: ParsedPerformanceScore;
  personas: ParsedPersona[];
  actionPriorities: ParsedActionPriority[];
  contentRecommendations?: string | null;
  videoRequests: string[];
  whatUsersLike: string[];
  whatUsersDislike: string[];
  comments: ParsedCommentSample[];
  raw: any;
}

function safeNumber(value: any): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && !Number.isNaN(n) ? n : undefined;
}

export function parseAnalysis(raw: any): ParsedAnalysis {
  const safeNumber = (val: any) => (typeof val === "number" ? val : undefined);

  // Handle new backend format: raw.video_info instead of raw.video
  const video: ParsedVideoMeta = {
    id: raw.video_info?.title ? raw.video_id : raw.video?.id,
    title: raw.video_info?.title ?? raw.video?.title,
    thumbnailUrl: raw.video_info?.thumbnail ?? raw.video_info?.thumbnail_url ?? raw.video?.thumbnail_url,
    channelTitle: raw.video_info?.channel ?? raw.video_info?.channel_title ?? raw.video?.channel_title,
    publishedAt: raw.video_info?.upload_date ?? raw.video_info?.published_at ?? raw.video?.published_at,
    viewCount: safeNumber(raw.video_info?.view_count ?? raw.video?.view_count),
    likeCount: safeNumber(raw.video_info?.like_count ?? raw.video?.like_count),
    duration: raw.video_info?.duration ? String(raw.video_info?.duration) : raw.video?.duration,
  };

  // Handle new backend format: raw.results instead of raw.analysis.ai_insights
  const analysis = raw.results ?? raw.analysis ?? {};
  const ai = analysis.ai_insights ?? analysis; // For new format, analysis is already the insights

  const completedAt: string | undefined =
    ai.analysis_timestamp ?? analysis.analysis_timestamp ?? raw.analysis_timestamp;

  // Handle sentiment from new format
  const s = ai.sentiment_summary ?? ai.sentiment_analysis ?? {};
  const sentimentScore = safeNumber(s.average_score ?? s.sentiment_score);

  let label: string | undefined = s.dominant_sentiment ?? s.overall_sentiment;
  if (!label && typeof sentimentScore === "number") {
    if (sentimentScore > 0.6) label = "positive";
    else if (sentimentScore < 0.4) label = "negative";
    else label = "neutral";
  }

  const sentiment: ParsedSentiment | null =
    sentimentScore != null || label
      ? {
        score: sentimentScore,
        label,
        positive_ratio: safeNumber(s.positive_ratio ?? s.distribution?.positive),
        neutral_ratio: safeNumber(s.neutral_ratio ?? s.distribution?.neutral),
        negative_ratio: safeNumber(s.negative_ratio ?? s.distribution?.negative),
      }
      : null;

  // Handle topics from new format
  const topicsRaw = ai.topic_analysis?.main_topics ?? ai.topics;
  const topics: ParsedTopic[] = Array.isArray(topicsRaw)
    ? topicsRaw
      .map((t: any) => ({
        topic: typeof t?.topic === "string" ? t.topic : "(unknown)",
        frequency: safeNumber(t?.frequency),
        sentiment: typeof t?.sentiment === "string" ? t.sentiment : undefined,
      }))
      .filter((t) => t.topic)
    : [];

  const matrixRaw = ai.topic_analysis?.topic_sentiment_matrix ?? ai.topic_sentiment_matrix ?? {};
  const topicMatrix: ParsedTopicMatrixRow[] = Object.entries<any>(matrixRaw).map(
    ([topic, vals]) => ({
      topic,
      positive: safeNumber(vals?.positive),
      neutral: safeNumber(vals?.neutral),
      negative: safeNumber(vals?.negative),
    }),
  );

  const em = ai.engagement_metrics ?? {};
  const engagement: ParsedEngagementMetrics = {
    overallScore: safeNumber(em.overall_score),
    engagementLevel: em.engagement_level,
    averageCommentLength: safeNumber(em.average_comment_length),
    averageLikes: safeNumber(em.average_likes),
    uniqueAuthors: safeNumber(em.unique_authors),
    authorDiversity: safeNumber(em.author_diversity),
  };

  const ps = ai.performance_score ?? {};
  const performance: ParsedPerformanceScore = {
    overallScore: safeNumber(ps.overall_score),
    grade: ps.performance_grade,
    subScores: {
      engagement: safeNumber(ps.sub_scores?.engagement) ?? 0,
      satisfaction: safeNumber(ps.sub_scores?.satisfaction) ?? 0,
      viral_potential: safeNumber(ps.sub_scores?.viral_potential) ?? 0,
    },
  };

  const personasRaw = ai.persona_analysis?.viewer_personas;
  const personas: ParsedPersona[] = Array.isArray(personasRaw)
    ? personasRaw.map((p: any) => ({
      persona: typeof p?.persona === "string" ? p.persona : "Unknown",
      percentage: safeNumber(p?.percentage),
      characteristics: Array.isArray(p?.characteristics) ? p.characteristics : [],
      caresAbout: Array.isArray(p?.what_they_care_about) ? p.what_they_care_about : [],
      engagementPattern: typeof p?.engagement_pattern === "string" ? p.engagement_pattern : undefined,
      exampleComments: Array.isArray(p?.example_comments) ? p.example_comments : [],
    }))
    : [];

  const top3Raw = ai.actionable_insights?.top_3_priorities;
  const actionPriorities: ParsedActionPriority[] = Array.isArray(top3Raw)
    ? top3Raw.map((a: any) => ({
      action: typeof a?.action === "string" ? a.action : "",
      priority: a?.priority,
      effort: a?.effort,
      impact: a?.impact,
      reasoning: a?.reasoning,
    }))
    : [];

  const contentRecommendations: string | null = ai.content_recommendations ?? null;

  const videoRequestsRaw = ai.video_requests;
  const videoRequests: string[] = Array.isArray(videoRequestsRaw)
    ? videoRequestsRaw.filter((req: any) => typeof req === "string" && req.trim())
    : [];

  const whatUsersLikeRaw = ai.what_users_like;
  const whatUsersLike: string[] = Array.isArray(whatUsersLikeRaw)
    ? whatUsersLikeRaw.filter((item: any) => typeof item === "string" && item.trim())
    : [];

  const whatUsersDislikeRaw = ai.what_users_dislike;
  const whatUsersDislike: string[] = Array.isArray(whatUsersDislikeRaw)
    ? whatUsersDislikeRaw.filter((item: any) => typeof item === "string" && item.trim())
    : [];

  const commentsRaw = ai.comments_sample ?? ai.detailed_results;
  const comments: ParsedCommentSample[] = Array.isArray(commentsRaw)
    ? commentsRaw.map((c: any) => ({
      text: String(c?.text ?? ""),
      authorName: c?.author ?? c?.author_name,
      likeCount: safeNumber(c?.likes ?? c?.like_count),
      publishedAt: c?.timestamp ?? c?.published_at,
    }))
    : [];

  return {
    analysisId: raw.analysis_id ?? raw.id,
    completedAt,
    video,
    sentiment,
    sentimentRatios: {
      positive: safeNumber(s.distribution?.positive ?? s.positive_ratio),
      neutral: safeNumber(s.distribution?.neutral ?? s.neutral_ratio),
      negative: safeNumber(s.distribution?.negative ?? s.negative_ratio),
    },
    topics,
    topicMatrix,
    engagement,
    performance,
    personas,
    actionPriorities,
    contentRecommendations,
    videoRequests,
    whatUsersLike,
    whatUsersDislike,
    comments,
    raw,
  };
}
