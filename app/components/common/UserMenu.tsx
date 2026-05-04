"use client";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function UserMenu() {
  const t = useTranslations('userMenu');

  return (
    <Button variant="primary" asChild>
      <Link
        href="/editor"
        className="text-md font-medium text-white hover:text-white/90 transition-colors"
      >
        <Icon icon="solar:video-frame-cut-2-linear" className="mr-2" />
        {t('editor')}
      </Link>
    </Button>
  );
}