#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""FB-CA5196: hide technical comments as admin; add clear public + admin notes; mark done."""
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

FB = Path("/var/www/monitoring/data/feedback.json")
TARGET = "ca51967b-cec7-40ef-9b0b-c4b069da7cda"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

store = json.loads(FB.read_text(encoding="utf-8"))
item = next((i for i in store["items"] if i["id"] == TARGET), None)
if not item:
    raise SystemExit("ticket not found")

# Mark prior technical notes as admin-only
for c in item.get("comments", []):
    body = c.get("body") or ""
    who = (c.get("displayName") or "") + (c.get("username") or "")
    if (
        "Fact_" in body
        or "MinFacture" in body
        or "TotalOrders" in body
        or "SmartPowerBI" in body
        or "نیاز به تصمیم" in body
        or "بررسی فنی" in body
        or "onyx" in who.lower()
        or "اصلاح خودکار" in who
        or "بررسی Onyx" in who
    ):
        c["visibility"] = "admin"
    else:
        c.setdefault("visibility", "public")

PUBLIC = (
    "بررسی شد.\n"
    "عدد «تعداد سفارش» در اینسایت از همان منبع فروش می‌آید؛ "
    "دیدبان قبلاً عدد دیگری نشان می‌داد.\n"
    "الان تعداد سفارش دیدبان با اینسایت یکی شده است."
)
ADMIN = (
    "[ادمین] Insight Main Performance KPI totalInvoices = "
    "Fact_SalesSummary.TotalOrders (aggregate_branch_sales_normalized). "
    "دیدبان قبلاً MinFactureCount از Fact_Subscription را به‌عنوان تعداد سفارش نشان می‌داد "
    "(مخرج درصد اشتراک). الان FactureCount=TotalOrders؛ درصد اشتراک همچنان روی MinFactureCount."
)

actor = {
    "userId": "system-fix",
    "username": "onyx",
    "displayName": "پشتیبانی دیدبان",
}


def add_comment(body: str, visibility: str):
    cid = str(uuid4())
    item.setdefault("comments", []).append(
        {
            "id": cid,
            "at": now,
            "userId": actor["userId"],
            "username": actor["username"],
            "displayName": actor["displayName"],
            "body": body,
            "visibility": visibility,
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
            "detail": (f"[ادمین] {body}" if visibility == "admin" else body)[:200],
        }
    )


# Avoid duplicate public resolution if re-run
if not any(
    (c.get("visibility") != "admin") and "با اینسایت یکی شده" in (c.get("body") or "")
    for c in item.get("comments", [])
):
    add_comment(PUBLIC, "public")
if not any(
    c.get("visibility") == "admin" and "aggregate_branch_sales_normalized" in (c.get("body") or "")
    for c in item.get("comments", [])
):
    add_comment(ADMIN, "admin")

old = item.get("status")
item["status"] = "done"
item["updatedAt"] = now
if old != "done":
    item.setdefault("activity", []).append(
        {
            "id": str(uuid4()),
            "at": now,
            "userId": actor["userId"],
            "username": actor["username"],
            "displayName": actor["displayName"],
            "action": "status",
            "detail": "تغییر وضعیت به انجام شد",
        }
    )

FB.write_text(json.dumps(store, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("status", old, "->", item["status"])
print(
    "comments",
    [
        (c.get("visibility"), (c.get("body") or "")[:40])
        for c in item.get("comments", [])
    ],
)
