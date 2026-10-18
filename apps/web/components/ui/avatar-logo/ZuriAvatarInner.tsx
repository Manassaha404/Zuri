"use client";

import { createAvatar } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";
import definition from "./zuri.avatar.json";

// createAvatar infers animation/expression key types from the JSON definition
export const ZuriAvatarInner = createAvatar(definition);
export type ZuriAvatarInnerProps = React.ComponentProps<typeof ZuriAvatarInner>;
