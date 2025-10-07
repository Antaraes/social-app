import Link from 'next/link';

export const parseTextWithHashtagsAndMentions = (text: string) => {
  const parts = [];
  let lastIndex = 0;

  // Combined regex for hashtags and mentions
  const regex = /(#\w+|@\w+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedText = match[0];

    if (matchedText.startsWith('#')) {
      // It's a hashtag
      const hashtag = matchedText.substring(1);
      parts.push(
        <Link
          key={`${match.index}-hashtag`}
          href={`/hashtag/${hashtag}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {matchedText}
        </Link>
      );
    } else if (matchedText.startsWith('@')) {
      // It's a mention
      const username = matchedText.substring(1);
      parts.push(
        <Link
          key={`${match.index}-mention`}
          href={`/user/${username}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {matchedText}
        </Link>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
};

export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.substring(1)) : [];
};
