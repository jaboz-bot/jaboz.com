package com.jaboz.at;

import java.util.Calendar;
import java.util.HashSet;
import java.util.TimeZone;

/** Chạy bằng javac/java, không cần thiết bị. */
public final class CloseScheduleTest {
    private static int checks;

    public static void main(String[] args) {
        TimeZone zone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        if (!"Asia/Ho_Chi_Minh".equals(zone.getID())) {
            throw new AssertionError("zone " + zone.getID());
        }
        assertSaturday(zone);
        weekdayAfternoonShowsSite(zone);
        reopenAfter1645IsNotImmediate(zone);
        eveningCloseAndReopen(zone);
        saturdayMorningOnlyIfOpenedThatMorning(zone);
        pageSchedulesAreNotAppCloses(zone);
        crossedSeveralSlotsStillShowsSiteOnce(zone);
        firedSlotDoesNotRepeat(zone);
        clockJump(zone);
        nextDayRecurrence(zone);
        delayTracksWallClock(zone);
        local1645IsNotUtc(zone);
        chromeSpecDoesNotAskForANewTab();
        if (checks < 40) {
            throw new AssertionError("too few checks: " + checks);
        }
        System.out.println("CloseScheduleTest ok checks=" + checks);
    }

    private static void weekdayAfternoonShowsSite(TimeZone zone) {
        long open = at(zone, 2026, 11, 9, 9, 0, 0);
        CloseSchedule.Session session = new CloseSchedule.Session(open);
        CloseSchedule.Decision before = session.tick(at(zone, 2026, 11, 9, 16, 44, 59), zone);
        eq(CloseSchedule.Kind.NONE, before.kind, before.toString());
        CloseSchedule.Decision due = session.tick(at(zone, 2026, 11, 9, 16, 45, 0), zone);
        eq(CloseSchedule.Kind.CLOSE_AND_SHOW_SITE, due.kind, due.toString());
        eq("2026-11-09T16:45", due.slotIds.get(0), due.toString());
        CloseSchedule.Decision exactOpen = new CloseSchedule.Session(at(zone, 2026, 11, 9, 16, 45, 0))
                .tick(at(zone, 2026, 11, 9, 16, 45, 0), zone);
        eq(CloseSchedule.Kind.NONE, exactOpen.kind, "opened exactly at 16:45 must stay open");
    }

    private static void reopenAfter1645IsNotImmediate(TimeZone zone) {
        CloseSchedule.Session reopened = new CloseSchedule.Session(at(zone, 2026, 11, 9, 16, 46, 0));
        CloseSchedule.Decision now = reopened.tick(at(zone, 2026, 11, 9, 16, 46, 0), zone);
        eq(CloseSchedule.Kind.NONE, now.kind, now.toString());
        eq("2026-11-09T20:25", now.slotIds.get(0), now.toString());
    }

    private static void eveningCloseAndReopen(TimeZone zone) {
        CloseSchedule.Session session = new CloseSchedule.Session(at(zone, 2026, 11, 9, 17, 0, 0));
        eq(CloseSchedule.Kind.NONE, session.tick(at(zone, 2026, 11, 9, 20, 24, 59), zone).kind, "20:24");
        CloseSchedule.Decision due = session.tick(at(zone, 2026, 11, 9, 20, 25, 0), zone);
        eq(CloseSchedule.Kind.CLOSE, due.kind, due.toString());
        if (due.kind == CloseSchedule.Kind.CLOSE_AND_SHOW_SITE) {
            throw new AssertionError("20:25 must not open Chrome");
        }
        CloseSchedule.Session later = new CloseSchedule.Session(at(zone, 2026, 11, 9, 20, 26, 0));
        CloseSchedule.Decision stay = later.tick(at(zone, 2026, 11, 9, 20, 26, 1), zone);
        eq(CloseSchedule.Kind.NONE, stay.kind, stay.toString());
        eq("2026-11-10T16:45", stay.slotIds.get(0), stay.toString());
    }

    private static void saturdayMorningOnlyIfOpenedThatMorning(TimeZone zone) {
        long open = at(zone, 2026, 11, 7, 8, 0, 0);
        CloseSchedule.Session morning = new CloseSchedule.Session(open);
        eq(CloseSchedule.Kind.NONE, morning.tick(at(zone, 2026, 11, 7, 11, 49, 59), zone).kind, "11:49");
        CloseSchedule.Decision due = morning.tick(at(zone, 2026, 11, 7, 11, 50, 0), zone);
        eq(CloseSchedule.Kind.CLOSE, due.kind, due.toString());
        eq("2026-11-07T11:50", due.slotIds.get(0), due.toString());

        CloseSchedule.Decision after = new CloseSchedule.Session(at(zone, 2026, 11, 7, 11, 51, 0))
                .tick(at(zone, 2026, 11, 7, 11, 51, 0), zone);
        eq(CloseSchedule.Kind.NONE, after.kind, after.toString());
        eq("2026-11-07T16:45", after.slotIds.get(0), after.toString());

        CloseSchedule.Decision afternoon = new CloseSchedule.Session(at(zone, 2026, 11, 7, 12, 0, 0))
                .tick(at(zone, 2026, 11, 7, 12, 0, 0), zone);
        eq(CloseSchedule.Kind.NONE, afternoon.kind, afternoon.toString());
        eq("2026-11-07T16:45", afternoon.slotIds.get(0), "afternoon open waits for 16:45");

        CloseSchedule.Decision fromFriday = new CloseSchedule.Session(at(zone, 2026, 11, 6, 22, 0, 0))
                .tick(at(zone, 2026, 11, 7, 11, 50, 0), zone);
        eq(CloseSchedule.Kind.NONE, fromFriday.kind, fromFriday.toString());
        eq("2026-11-07T16:45", fromFriday.slotIds.get(0), "Friday session skips Saturday 11:50");

        CloseSchedule.Decision justAfterMidnight = new CloseSchedule.Session(at(zone, 2026, 11, 7, 0, 10, 0))
                .tick(at(zone, 2026, 11, 7, 11, 50, 0), zone);
        eq(CloseSchedule.Kind.CLOSE, justAfterMidnight.kind, "00:10 Saturday still counts as that morning");

        CloseSchedule.Decision sunday = new CloseSchedule.Session(at(zone, 2026, 11, 8, 8, 0, 0))
                .tick(at(zone, 2026, 11, 8, 11, 50, 0), zone);
        eq(CloseSchedule.Kind.NONE, sunday.kind, sunday.toString());
        eq("2026-11-08T16:45", sunday.slotIds.get(0), "Sunday has no 11:50 close");
    }

    private static void pageSchedulesAreNotAppCloses(TimeZone zone) {
        CloseSchedule.Session early = new CloseSchedule.Session(at(zone, 2026, 11, 9, 7, 0, 0));
        eq(CloseSchedule.Kind.NONE, early.tick(at(zone, 2026, 11, 9, 8, 0, 0), zone).kind, "08:00 is page pause");
        eq(CloseSchedule.Kind.NONE, early.tick(at(zone, 2026, 11, 9, 12, 30, 0), zone).kind, "lunch is page reset");
        eq(CloseSchedule.Kind.NONE, early.tick(at(zone, 2026, 11, 9, 16, 44, 0), zone).kind, "before 16:45");
        CloseSchedule.Session afterAfternoon = new CloseSchedule.Session(at(zone, 2026, 11, 9, 16, 50, 0));
        CloseSchedule.Decision atPageReset = afterAfternoon.tick(at(zone, 2026, 11, 9, 16, 55, 0), zone);
        eq(CloseSchedule.Kind.NONE, atPageReset.kind, atPageReset.toString());
        eq("2026-11-09T20:25", atPageReset.slotIds.get(0), "16:55 stays a page event");
    }

    private static void crossedSeveralSlotsStillShowsSiteOnce(TimeZone zone) {
        CloseSchedule.Decision saturdayNight = new CloseSchedule.Session(at(zone, 2026, 11, 7, 8, 0, 0))
                .tick(at(zone, 2026, 11, 7, 21, 0, 0), zone);
        eq(CloseSchedule.Kind.CLOSE_AND_SHOW_SITE, saturdayNight.kind, saturdayNight.toString());
        contains(saturdayNight, "2026-11-07T11:50");
        contains(saturdayNight, "2026-11-07T16:45");
        contains(saturdayNight, "2026-11-07T20:25");

        CloseSchedule.Decision eveningOnly = new CloseSchedule.Session(at(zone, 2026, 11, 9, 17, 0, 0))
                .tick(at(zone, 2026, 11, 9, 21, 0, 0), zone);
        eq(CloseSchedule.Kind.CLOSE, eveningOnly.kind, eveningOnly.toString());
        if (eveningOnly.slotIds.contains("2026-11-09T16:45")) {
            throw new AssertionError("session opened at 17:00 did not cross 16:45");
        }

        CloseSchedule.Decision frozen = new CloseSchedule.Session(at(zone, 2026, 11, 9, 9, 0, 0))
                .tick(at(zone, 2026, 11, 11, 10, 0, 0), zone);
        eq(CloseSchedule.Kind.CLOSE_AND_SHOW_SITE, frozen.kind, frozen.toString());
    }

    private static void firedSlotDoesNotRepeat(TimeZone zone) {
        CloseSchedule.Session session = new CloseSchedule.Session(at(zone, 2026, 11, 9, 9, 0, 0));
        CloseSchedule.Decision first = session.tick(at(zone, 2026, 11, 9, 16, 45, 0), zone);
        eq(CloseSchedule.Kind.CLOSE_AND_SHOW_SITE, first.kind, first.toString());
        session.markFired(first);
        CloseSchedule.Decision second = session.tick(at(zone, 2026, 11, 9, 16, 45, 5), zone);
        eq(CloseSchedule.Kind.NONE, second.kind, second.toString());
        eq("2026-11-09T20:25", second.slotIds.get(0), "same session waits for 20:25");
    }

    private static void clockJump(TimeZone zone) {
        CloseSchedule.Decision forward = new CloseSchedule.Session(at(zone, 2026, 11, 9, 9, 0, 0))
                .tick(at(zone, 2026, 11, 9, 17, 0, 0), zone);
        eq(CloseSchedule.Kind.CLOSE_AND_SHOW_SITE, forward.kind, "clock forward past 16:45");
        CloseSchedule.Decision backward = new CloseSchedule.Session(at(zone, 2026, 11, 9, 17, 0, 0))
                .tick(at(zone, 2026, 11, 9, 10, 0, 0), zone);
        eq(CloseSchedule.Kind.NONE, backward.kind, backward.toString());
        eq("2026-11-09T20:25", backward.slotIds.get(0), "clock back does not reopen 16:45 for this session");
    }

    private static void nextDayRecurrence(TimeZone zone) {
        CloseSchedule.Decision mondayNight = new CloseSchedule.Session(at(zone, 2026, 11, 9, 21, 30, 0))
                .tick(at(zone, 2026, 11, 9, 21, 30, 0), zone);
        eq(CloseSchedule.Kind.NONE, mondayNight.kind, mondayNight.toString());
        eq("2026-11-10T16:45", mondayNight.slotIds.get(0), mondayNight.toString());
    }

    private static void delayTracksWallClock(TimeZone zone) {
        CloseSchedule.Decision tenSeconds = new CloseSchedule.Session(at(zone, 2026, 11, 9, 9, 0, 0))
                .tick(at(zone, 2026, 11, 9, 16, 44, 50), zone);
        eq(CloseSchedule.Kind.NONE, tenSeconds.kind, tenSeconds.toString());
        eq(10_000L, tenSeconds.delayMs, tenSeconds.toString());
        CloseSchedule.Decision capped = new CloseSchedule.Session(at(zone, 2026, 11, 9, 9, 0, 0))
                .tick(at(zone, 2026, 11, 9, 16, 0, 0), zone);
        eq(CloseSchedule.POLL_MS, capped.delayMs, capped.toString());
    }

    private static void local1645IsNotUtc(TimeZone zone) {
        long local = at(zone, 2026, 11, 9, 16, 45, 0);
        Calendar utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        utc.setTimeInMillis(local);
        eq(9, utc.get(Calendar.HOUR_OF_DAY), "ICT 16:45 is 09:45 UTC");
        eq(45, utc.get(Calendar.MINUTE), "minute");
        TimeZone utcZone = TimeZone.getTimeZone("UTC");
        long open = at(utcZone, 2026, 11, 9, 2, 0, 0);
        long now = at(utcZone, 2026, 11, 9, 9, 45, 0);
        eq(CloseSchedule.Kind.CLOSE_AND_SHOW_SITE,
                new CloseSchedule.Session(open).tick(now, zone).kind,
                "09:45 UTC is 16:45 ICT");
        CloseSchedule.Decision asUtc = new CloseSchedule.Session(open).tick(now, utcZone);
        eq(CloseSchedule.Kind.NONE, asUtc.kind, asUtc.toString());
        eq("2026-11-09T16:45", asUtc.slotIds.get(0), "same instant is still morning in UTC");
    }

    private static void chromeSpecDoesNotAskForANewTab() {
        CompanyChrome.Spec spec = CompanyChrome.viewSpec("com.jaboz.at");
        eq(CompanyChrome.ACTION_VIEW, spec.action, "action");
        eq(CompanyChrome.COMPANY_URL, spec.url, "url");
        eq("http://192.168.10.27:5009", spec.url, "literal company url");
        eq(CompanyChrome.CHROME_PACKAGE, spec.targetPackage, "package");
        eq("com.jaboz.at", spec.applicationId, "app id");
        eq(false, spec.createNewTab, "create_new_tab");
        eq(CompanyChrome.FLAG_ACTIVITY_NEW_TASK, spec.flags, "flags");
        if ((spec.flags & 0x04000000) != 0) {
            throw new AssertionError("CLEAR_TOP must stay off");
        }
        eq(CompanyChrome.EXTRA_APPLICATION_ID, "com.android.browser.application_id", "extra name");
        eq(CompanyChrome.EXTRA_CREATE_NEW_TAB, "create_new_tab", "extra name");
    }

    private static void assertSaturday(TimeZone zone) {
        Calendar day = Calendar.getInstance(zone);
        day.setTimeInMillis(at(zone, 2026, 11, 7, 8, 0, 0));
        eq(Calendar.SATURDAY, day.get(Calendar.DAY_OF_WEEK), "2026-11-07");
        day.setTimeInMillis(at(zone, 2026, 11, 8, 8, 0, 0));
        eq(Calendar.SUNDAY, day.get(Calendar.DAY_OF_WEEK), "2026-11-08");
        day.setTimeInMillis(at(zone, 2026, 11, 9, 8, 0, 0));
        eq(Calendar.MONDAY, day.get(Calendar.DAY_OF_WEEK), "2026-11-09");
    }

    private static void contains(CloseSchedule.Decision decision, String id) {
        checks++;
        if (!decision.slotIds.contains(id)) {
            throw new AssertionError("missing " + id + " in " + decision);
        }
    }

    private static long at(TimeZone zone, int year, int month, int day, int hour, int minute, int second) {
        Calendar calendar = Calendar.getInstance(zone);
        calendar.clear();
        calendar.setTimeZone(zone);
        calendar.set(year, month - 1, day, hour, minute, second);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private static void eq(long expected, long actual, String label) {
        checks++;
        if (expected != actual) {
            throw new AssertionError(label + " expected " + expected + " but was " + actual);
        }
    }

    private static void eq(Object expected, Object actual, String label) {
        checks++;
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new AssertionError(label + " expected " + expected + " but was " + actual);
        }
    }
}
