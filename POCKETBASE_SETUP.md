# Cross2 + PocketBase Setup

## Prerequisites
- PocketBase deployed somewhere publicly accessible
- Cross2 deployed on Coolify

## 1. Deploy PocketBase on Coolify

1. In Coolify dashboard → Add New Resource → Select "PocketBase"
2. Or use Docker Compose:

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    ports:
      - "8090:8090"
    volumes:
      - ./pb_data:/pb_data
    restart: unless-stopped
```

3. Note the PocketBase URL (e.g., `https://pb.yourdomain.com`)

## 2. Configure Cross2

Set the environment variable in Coolify:
```
VITE_POCKETBASE_URL=https://pb.yourdomain.com
```

## 3. Setup PocketBase Schema

1. Go to PocketBase Admin UI: `https://pb.yourdomain.com/_/`
2. Create admin account
3. Create these collections:

### users (auth type) — built-in, no action needed

### exercises (base type)
| Field | Type | Options |
|---|---|---|
| name | text | required |
| description | text | |
| muscles | json | |
| tipo | select | values: aerobico, anaerobico |
| difficulty | select | values: beginner, intermediate, advanced |
| gif_url | url | |
| group_id | text | |

### workouts (base type)
| Field | Type | Options |
|---|---|---|
| name | text | required |
| user_id | text | required |

### workout_stations (base type)
| Field | Type | Options |
|---|---|---|
| workout_id | text | required |
| category_id | select | values: forza, cardio1, cardio2 |
| sort_order | number | |

### station_exercises (base type)
| Field | Type | Options |
|---|---|---|
| station_id | text | required |
| exercise_id | text | required |
| exercise_name | text | |
| sort_order | number | |

### user_profiles (base type)
| Field | Type | Options |
|---|---|---|
| user_id | text | required |
| display_name | text | |
| role | select | values: user, admin, enabled, pending |

### exercise_groups (base type)
| Field | Type | Options |
|---|---|---|
| name | text | required |
| sort_order | number | |

### gif_mappings (base type)
| Field | Type | Options |
|---|---|---|
| exercise_id | text | required |
| gif_url | url | |

For all collections: set listRule, viewRule, createRule, updateRule, deleteRule to `""` (empty = public).

## 4. Create Admin User

In PocketBase Admin UI → Users → Create user with email `jarvis.vong@gmail.com`.

Then in user_profiles, create a record with:
- user_id: (the user's ID)
- role: admin

## 5. Deploy Cross2

Push code to GitHub → Coolify auto-deploys.

Set in Coolify environment:
```
VITE_POCKETBASE_URL=https://pb.yourdomain.com
```
