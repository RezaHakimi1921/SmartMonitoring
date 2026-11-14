#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rename review type + close/comment feedback bugs after 18 Aban fixes."""
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

DATA = Path("/var/www/monitoring/data")
CFG = DATA / "monitoring-config.json"
FB = DATA / "feedback.json"

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

# 1) rename live review type title
cfg = json.loads(CFG.read_text(encoding="utf-8"))
changed_title = False
for t in cfg.get("reviewTypes", []):
    if t.get("id") == "first":
        if t.get("title") != "بررسی پس از تحویل":
            t["title"] = "بررسی پس از تحویل"
            t["description"] = "راه‌اندازی و صحت تنظیمات پس از تحویل به مشتری"
            changed_title = True
CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("title_updated", changed_title)

# 2) feedback comments / status
store = json.loads(FB.read_text(encoding="utf-8"))
items = store.get("items", [])

UPDATES = {
    "4df3a52f-ff2b-4973-a517-baa5d0882701": {
        "status": "done",
        "comment": (
            "اصلاح شد: تقویم بازهٔ دلخواه داخل Card با overflow:hidden بریده می‌شد؛ "
            "الان تقویم در جریان صفحه باز می‌شود و روزها دیده می‌شوند. روی ۱۹۶ دیپلوی شد."
        ),
    },
    "9033231e-0b8a-40a5-ac9e-12e3644f94d5": {
        "status": "done",
        "comment": (
            "اصلاح شد: عنوان نوع بررسی «first» از «بررسی بعد از تمدید» به "
            "«بررسی پس از تحویل» تغییر کرد (کاتالوگ + کانفیگ زنده)."
        ),
    },
    "c7cdace2-b219-4aec-93f4-89f74764effe": {
        "status": "done",
        "comment": (
            "اصلاح شد: قطع ارتباط و شارژ پنل جدا هستند. در بخش اتصال، اگر روز بدون شارژ باشد "
            "در hints/نکات قابل‌بهبود هم می‌آید؛ برچسب قطع هم «در بازه» شد تا با وصل بودن فعلی اشتباه نشود. "
            "عدد ۹۵ برای ادیب روزهای تاریخی قطع در بازهٔ بلند است، نه وضعیت لحظه‌ای."
        ),
    },
    "ca51967b-cec7-40ef-9b0b-c4b069da7cda": {
        "status": "in_progress",
        "comment": (
            "نیاز به تصمیم شما: دیدبان «تعداد سفارش» را از Fact_Subscription.MinFactureCount "
            "می‌خواند (همان مخرج درصد اشتراک Insight). اگر اینسایت TotalOrders از Fact_SalesSummary "
            "نشان می‌دهد، اختلاف طبیعی است. بگویید کدام عدد روی کارت «تعداد سفارش» باشد: "
            "MinFacture یا TotalOrders؟"
        ),
    },
}

actor = {
    "userId": "system-fix",
    "username": "onyx",
    "displayName": "اصلاح خودکار",
}

for item in items:
    u = UPDATES.get(item.get("id"))
    if not u:
        continue
    old = item.get("status")
    item["status"] = u["status"]
    item["updatedAt"] = now
    cid = str(uuid4())
    item.setdefault("comments", []).append(
        {
            "id": cid,
            "at": now,
            "userId": actor["userId"],
            "username": actor["username"],
            "displayName": actor["displayName"],
            "body": u["comment"],
        }
    )
    item.setdefault("activity", []).append(
        {
            "id": str(uuid4()),
            "at": now,
            "userId": actor["userId"],
            "username": actor["username"],
            "displayName": actor["displayName"],
            "action": "comment",
            "detail": u["comment"][:180],
        }
    )
    if old != u["status"]:
        item["activity"].append(
            {
                "id": str(uuid4()),
                "at": now,
                "userId": actor["userId"],
                "username": actor["username"],
                "displayName": actor["displayName"],
                "action": "status",
                "detail": f"تغییر وضعیت به {u['status']}",
            }
        )
    print("feedback", item["id"][:8], old, "->", u["status"])

FB.write_text(json.dumps(store, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("ok")
