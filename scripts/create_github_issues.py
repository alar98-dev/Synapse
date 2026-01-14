#!/usr/bin/env python3
"""
Create GitHub issues from a CSV file. Usage:

    GITHUB_TOKEN=<token> python3 scripts/create_github_issues.py docs/planning/initial_backlog.csv owner repo

Requires: env var GITHUB_TOKEN with repo permissions.
"""
import csv
import os
import sys
import json
import requests

GITHUB_API = 'https://api.github.com'


def create_issue(owner, repo, title, body, labels=None):
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        raise SystemExit('GITHUB_TOKEN not set in env')
    url = f"{GITHUB_API}/repos/{owner}/{repo}/issues"
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    payload = {'title': title, 'body': body}
    if labels:
        payload['labels'] = labels
    r = requests.post(url, headers=headers, json=payload)
    if r.status_code not in (200, 201):
        print('Failed to create issue:', r.status_code, r.text)
        return None
    return r.json()


def main():
    if len(sys.argv) < 4:
        print('Usage: create_github_issues.py <csv-path> <owner> <repo>')
        sys.exit(2)
    csv_path = sys.argv[1]
    owner = sys.argv[2]
    repo = sys.argv[3]
    created = []
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            title = f"{row['Key']} - {row['Title']}"
            description = row.get('Description', '')
            labels = [l.strip() for l in row.get('Labels', '').split(';') if l.strip()]
            body = f"**Description**\n\n{description}\n\n**Priority**: {row.get('Priority','')}\n**Estimate**: {row.get('Estimate','')}\n**Dependency**: {row.get('Dependency','') or 'None'}"
            print('Creating:', title)
            res = create_issue(owner, repo, title, body, labels=labels)
            if res:
                created.append(res.get('html_url'))
    print('Created issues:')
    for u in created:
        print('-', u)


if __name__ == '__main__':
    main()
