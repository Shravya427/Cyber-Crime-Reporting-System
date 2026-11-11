from datetime import datetime, timezone, timedelta
from bson import ObjectId
from backend.utils.db import get_db, serialize_docs, serialize_doc

def get_admin_dashboard_metrics():
    """
    Computes comprehensive system-wide metrics using advanced MongoDB aggregation pipelines.
    Demonstrates $facet, $group, $project, $lookup, $unwind, and date expressions.
    """
    db = get_db()

    # 1. Pipeline for overall status counters, priority breakdown, and financial totals using $facet
    overview_pipeline = [
        {
            "$facet": {
                "status_counts": [
                    {
                        "$group": {
                            "_id": "$status",
                            "count": {"$sum": 1}
                        }
                    }
                ],
                "priority_counts": [
                    {
                        "$group": {
                            "_id": "$priority",
                            "count": {"$sum": 1}
                        }
                    }
                ],
                "financial_stats": [
                    {
                        "$group": {
                            "_id": None,
                            "total_loss": {"$sum": "$financial_loss"},
                            "avg_loss": {"$avg": "$financial_loss"},
                            "max_loss": {"$max": "$financial_loss"},
                            "cases_with_loss": {
                                "$sum": {
                                    "$cond": [{"$gt": ["$financial_loss", 0]}, 1, 0]
                                }
                            }
                        }
                    }
                ],
                "total_count": [
                    {"$count": "count"}
                ]
            }
        }
    ]

    overview_res = list(db.complaints.aggregate(overview_pipeline))
    overview_data = overview_res[0] if overview_res else {}

    # Format status metrics
    status_map = {item['_id']: item['count'] for item in overview_data.get('status_counts', [])}
    priority_map = {item['_id']: item['count'] for item in overview_data.get('priority_counts', [])}
    fin_stats = overview_data.get('financial_stats', [{}])[0] if overview_data.get('financial_stats') else {}
    total_complaints = overview_data.get('total_count', [{}])[0].get('count', 0) if overview_data.get('total_count') else 0

    pending_cases = status_map.get('Submitted', 0) + status_map.get('Under Review', 0)
    under_investigation = status_map.get('Assigned', 0) + status_map.get('Investigation in Progress', 0)
    resolved_cases = status_map.get('Resolved', 0) + status_map.get('Closed', 0)
    rejected_cases = status_map.get('Rejected', 0)
    high_priority_cases = priority_map.get('High', 0) + priority_map.get('Critical', 0)

    # 2. Crime Category Distribution Pipeline ($group, $sort)
    category_pipeline = [
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1},
                "total_loss": {"$sum": "$financial_loss"}
            }
        },
        {"$sort": {"count": -1}}
    ]
    category_stats = list(db.complaints.aggregate(category_pipeline))

    # 3. Monthly Complaint Trend Pipeline ($group by year-month)
    monthly_trend_pipeline = [
        {
            "$project": {
                "year_month": {
                    "$dateToString": {
                        "format": "%Y-%m",
                        "date": "$created_at"
                    }
                },
                "status": 1,
                "financial_loss": 1
            }
        },
        {
            "$group": {
                "_id": "$year_month",
                "count": {"$sum": 1},
                "resolved_count": {
                    "$sum": {
                        "$cond": [{"$in": ["$status", ["Resolved", "Closed"]]}, 1, 0]
                    }
                },
                "total_loss": {"$sum": "$financial_loss"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    monthly_trends = list(db.complaints.aggregate(monthly_trend_pipeline))

    # 4. Officer Workload Pipeline ($lookup with users & complaint grouping)
    officer_pipeline = [
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user_info"
            }
        },
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "complaints",
                "localField": "_id",
                "foreignField": "assigned_officer_id",
                "as": "assigned_cases"
            }
        },
        {
            "$project": {
                "officer_id": "$_id",
                "badge_number": "$badge_number",
                "name": "$user_info.full_name",
                "email": "$user_info.email",
                "rank": "$rank",
                "department": "$department",
                "active_cases_count": "$active_cases_count",
                "resolved_cases_count": "$resolved_cases_count",
                "total_assigned": {"$size": "$assigned_cases"}
            }
        },
        {"$sort": {"active_cases_count": -1}}
    ]
    officer_workload = list(db.officers.aggregate(officer_pipeline))

    # 5. Recent Complaints
    recent_complaints = list(db.complaints.find({}).sort("created_at", -1).limit(6))

    # 6. Recent Audit Logs
    recent_audit_logs = list(db.audit_logs.find({}).sort("timestamp", -1).limit(10))

    return {
        "summary": {
            "total_complaints": total_complaints,
            "pending_cases": pending_cases,
            "under_investigation": under_investigation,
            "resolved_cases": resolved_cases,
            "rejected_cases": rejected_cases,
            "high_priority_cases": high_priority_cases,
            "status_breakdown": status_map,
            "priority_breakdown": priority_map,
            "total_financial_loss": fin_stats.get('total_loss', 0.0),
            "avg_financial_loss": round(fin_stats.get('avg_loss', 0.0), 2)
        },
        "category_distribution": [
            {"category": item['_id'], "count": item['count'], "total_loss": item.get('total_loss', 0.0)}
            for item in category_stats
        ],
        "monthly_trends": [
            {"month": item['_id'], "count": item['count'], "resolved": item.get('resolved_count', 0), "loss": item.get('total_loss', 0)}
            for item in monthly_trends
        ],
        "officer_workload": serialize_docs(officer_workload),
        "recent_complaints": serialize_docs(recent_complaints),
        "recent_audit_logs": serialize_docs(recent_audit_logs)
    }

def get_officer_dashboard_metrics(officer_user: dict):
    """
    Computes dashboard metrics specifically for the logged-in officer.
    """
    db = get_db()
    user_id = ObjectId(officer_user['user_id'])
    officer = db.officers.find_one({"user_id": user_id})
    officer_id = officer['_id'] if officer else user_id

    # Pipeline for officer case stats
    pipeline = [
        {"$match": {"assigned_officer_id": officer_id}},
        {
            "$facet": {
                "status_counts": [
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
                ],
                "priority_counts": [
                    {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
                ],
                "total_cases": [
                    {"$count": "count"}
                ]
            }
        }
    ]
    res = list(db.complaints.aggregate(pipeline))
    facet = res[0] if res else {}

    status_map = {item['_id']: item['count'] for item in facet.get('status_counts', [])}
    priority_map = {item['_id']: item['count'] for item in facet.get('priority_counts', [])}
    total = facet.get('total_cases', [{}])[0].get('count', 0) if facet.get('total_cases') else 0

    assigned_cases = list(db.complaints.find({"assigned_officer_id": officer_id}).sort("created_at", -1).limit(10))
    recent_investigations = list(db.investigations.find({"officer_user_id": user_id}).sort("created_at", -1).limit(6))

    return {
        "officer_profile": serialize_doc(officer),
        "summary": {
            "total_cases": total,
            "active_cases": status_map.get("Investigation in Progress", 0) + status_map.get("Assigned", 0),
            "under_review": status_map.get("Under Review", 0),
            "resolved_cases": status_map.get("Resolved", 0) + status_map.get("Closed", 0),
            "critical_cases": priority_map.get("Critical", 0) + priority_map.get("High", 0),
            "status_breakdown": status_map,
            "priority_breakdown": priority_map
        },
        "assigned_complaints": serialize_docs(assigned_cases),
        "recent_investigations": serialize_docs(recent_investigations)
    }

def get_citizen_dashboard_metrics(citizen_user: dict):
    """
    Computes dashboard metrics for the logged-in citizen.
    """
    db = get_db()
    citizen_id = ObjectId(citizen_user['user_id'])

    pipeline = [
        {"$match": {"citizen_id": citizen_id}},
        {
            "$facet": {
                "status_counts": [
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
                ],
                "total_loss": [
                    {"$group": {"_id": None, "total": {"$sum": "$financial_loss"}}}
                ],
                "total_cases": [
                    {"$count": "count"}
                ]
            }
        }
    ]
    res = list(db.complaints.aggregate(pipeline))
    facet = res[0] if res else {}

    status_map = {item['_id']: item['count'] for item in facet.get('status_counts', [])}
    total = facet.get('total_cases', [{}])[0].get('count', 0) if facet.get('total_cases') else 0
    total_loss = facet.get('total_loss', [{}])[0].get('total', 0.0) if facet.get('total_loss') else 0.0

    recent_complaints = list(db.complaints.find({"citizen_id": citizen_id}).sort("created_at", -1).limit(5))
    notifications = list(db.notifications.find({"recipient_id": citizen_id}).sort("created_at", -1).limit(5))

    return {
        "summary": {
            "total_complaints": total,
            "in_progress": status_map.get("Assigned", 0) + status_map.get("Investigation in Progress", 0),
            "submitted_pending": status_map.get("Submitted", 0) + status_map.get("Under Review", 0),
            "resolved": status_map.get("Resolved", 0) + status_map.get("Closed", 0),
            "rejected": status_map.get("Rejected", 0),
            "total_financial_loss": total_loss,
            "status_breakdown": status_map
        },
        "recent_complaints": serialize_docs(recent_complaints),
        "notifications": serialize_docs(notifications)
    }
