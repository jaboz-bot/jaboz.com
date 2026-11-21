package com.jaboz.at;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;

/**
 * Khi nào activity AT tự đóng.
 *
 * <p>Múi giờ là múi giờ máy ({@link TimeZone#getDefault()} khi activity gọi).
 * Trong APK và bookmark không có múi giờ công ty (không có ZoneId / Asia / GMT).
 *
 * <p>Đóng nghĩa là kết thúc phiên đang mở, không phải khóa cửa sổ giờ. Phiên chỉ
 * gặp một mốc nếu {@code openedAt} đứng trước mốc đó. Mở lại sau khi đã đóng là
 * phiên mới: không đóng lập tức chỉ vì đồng hồ đã qua 16:45, 20:25 hay 11:50.
 *
 * <p>Mốc, theo giờ lịch được truyền vào:
 * <ul>
 *   <li>16:45 mỗi ngày — đóng và đưa trang công ty lên Chrome</li>
 *   <li>20:25 mỗi ngày — chỉ đóng</li>
 *   <li>11:50 thứ Bảy — chỉ đóng, và chỉ nếu phiên được mở sáng thứ Bảy đó
 *       (cùng ngày, trước 11:50). Phiên mở từ hôm trước không ăn mốc này.</li>
 * </ul>
 * Lịch 08:00 / 12:00–13:00 / 16:55 của script nhập liệu nằm trên trang, không phải
 * lịch đóng app.
 */
public final class CloseSchedule {
    public static final int POLL_MS = 15_000;

    public static final int SHOW_SITE_HOUR = 16;
    public static final int SHOW_SITE_MINUTE = 45;
    public static final int EVENING_HOUR = 20;
    public static final int EVENING_MINUTE = 25;
    public static final int SATURDAY_MORNING_HOUR = 11;
    public static final int SATURDAY_MORNING_MINUTE = 50;

    public enum Kind {
        NONE,
        CLOSE,
        CLOSE_AND_SHOW_SITE
    }

    public static final class Decision {
        public final Kind kind;
        public final long delayMs;
        public final List<String> slotIds;

        public Decision(Kind kind, long delayMs, List<String> slotIds) {
            this.kind = kind;
            this.delayMs = delayMs;
            this.slotIds = slotIds == null
                    ? Collections.emptyList()
                    : Collections.unmodifiableList(new ArrayList<>(slotIds));
        }

        @Override
        public String toString() {
            return kind + " delayMs=" + delayMs + " slots=" + slotIds;
        }
    }

    /** Một lần mở activity. {@code fired} chặn đóng lặp lại nếu activity chưa kịp finish. */
    public static final class Session {
        public final long openedAtMillis;
        private final Set<String> fired = new HashSet<>();

        public Session(long openedAtMillis) {
            this.openedAtMillis = openedAtMillis;
        }

        public Decision tick(long nowMillis, TimeZone zone) {
            return evaluate(nowMillis, openedAtMillis, zone, fired);
        }

        public void markFired(Decision decision) {
            if (decision != null) {
                fired.addAll(decision.slotIds);
            }
        }
    }

    private static final class Slot {
        final long epochMillis;
        final Kind kind;
        final String id;

        Slot(long epochMillis, Kind kind, String id) {
            this.epochMillis = epochMillis;
            this.kind = kind;
            this.id = id;
        }
    }

    public static Decision evaluate(long nowMillis, long openedAtMillis, TimeZone zone, Set<String> fired) {
        TimeZone tz = zone == null ? TimeZone.getDefault() : zone;
        Set<String> done = fired == null ? Collections.emptySet() : fired;
        List<Slot> due = new ArrayList<>();
        Slot next = null;
        for (Slot slot : collect(nowMillis, openedAtMillis, tz)) {
            if (done.contains(slot.id)) {
                continue;
            }
            if (slot.epochMillis <= nowMillis) {
                due.add(slot);
            } else if (next == null || slot.epochMillis < next.epochMillis) {
                next = slot;
            }
        }
        if (!due.isEmpty()) {
            boolean showSite = false;
            List<String> ids = new ArrayList<>();
            for (Slot slot : due) {
                ids.add(slot.id);
                if (slot.kind == Kind.CLOSE_AND_SHOW_SITE) {
                    showSite = true;
                }
            }
            return new Decision(showSite ? Kind.CLOSE_AND_SHOW_SITE : Kind.CLOSE, 0L, ids);
        }
        if (next == null) {
            return new Decision(Kind.NONE, POLL_MS, Collections.emptyList());
        }
        long remain = Math.max(1L, next.epochMillis - nowMillis);
        long delay = Math.min(POLL_MS, remain);
        List<String> upcoming = new ArrayList<>();
        upcoming.add(next.id);
        return new Decision(Kind.NONE, delay, upcoming);
    }

    private static List<Slot> collect(long nowMillis, long openedAtMillis, TimeZone zone) {
        Calendar now = calendar(nowMillis, zone);
        Calendar opened = calendar(openedAtMillis, zone);
        Calendar end = midnight(now);
        end.add(Calendar.DATE, 1);
        Calendar start = midnight(opened);
        Calendar earliest = (Calendar) end.clone();
        earliest.add(Calendar.DATE, -14);
        if (start.before(earliest)) {
            start = earliest;
        }

        List<Slot> slots = new ArrayList<>();
        Calendar cursor = (Calendar) start.clone();
        int guard = 0;
        while (!cursor.after(end) && guard < 16) {
            addSlot(slots, cursor, SHOW_SITE_HOUR, SHOW_SITE_MINUTE, Kind.CLOSE_AND_SHOW_SITE, openedAtMillis, zone);
            addSlot(slots, cursor, EVENING_HOUR, EVENING_MINUTE, Kind.CLOSE, openedAtMillis, zone);
            if (cursor.get(Calendar.DAY_OF_WEEK) == Calendar.SATURDAY
                    && openedThatSaturdayMorning(opened, cursor)) {
                addSlot(slots, cursor, SATURDAY_MORNING_HOUR, SATURDAY_MORNING_MINUTE, Kind.CLOSE, openedAtMillis, zone);
            }
            cursor.add(Calendar.DATE, 1);
            guard++;
        }
        return slots;
    }

    /** Sáng thứ Bảy = cùng ngày lịch với mốc, trước 11:50. */
    private static boolean openedThatSaturdayMorning(Calendar opened, Calendar saturdayMidnight) {
        if (opened.get(Calendar.YEAR) != saturdayMidnight.get(Calendar.YEAR)) {
            return false;
        }
        if (opened.get(Calendar.DAY_OF_YEAR) != saturdayMidnight.get(Calendar.DAY_OF_YEAR)) {
            return false;
        }
        int minutes = opened.get(Calendar.HOUR_OF_DAY) * 60 + opened.get(Calendar.MINUTE);
        return minutes < SATURDAY_MORNING_HOUR * 60 + SATURDAY_MORNING_MINUTE;
    }

    private static void addSlot(
            List<Slot> slots,
            Calendar day,
            int hour,
            int minute,
            Kind kind,
            long openedAtMillis,
            TimeZone zone) {
        Calendar slot = (Calendar) day.clone();
        slot.setTimeZone(zone);
        slot.set(Calendar.HOUR_OF_DAY, hour);
        slot.set(Calendar.MINUTE, minute);
        slot.set(Calendar.SECOND, 0);
        slot.set(Calendar.MILLISECOND, 0);
        long epoch = slot.getTimeInMillis();
        if (openedAtMillis >= epoch) {
            return;
        }
        String id = String.format(
                "%04d-%02d-%02dT%02d:%02d",
                slot.get(Calendar.YEAR),
                slot.get(Calendar.MONTH) + 1,
                slot.get(Calendar.DAY_OF_MONTH),
                hour,
                minute);
        slots.add(new Slot(epoch, kind, id));
    }

    private static Calendar midnight(Calendar src) {
        Calendar day = (Calendar) src.clone();
        day.set(Calendar.HOUR_OF_DAY, 0);
        day.set(Calendar.MINUTE, 0);
        day.set(Calendar.SECOND, 0);
        day.set(Calendar.MILLISECOND, 0);
        return day;
    }

    private static Calendar calendar(long millis, TimeZone zone) {
        Calendar calendar = Calendar.getInstance(zone);
        calendar.setTimeInMillis(millis);
        return calendar;
    }

    private CloseSchedule() {}
}
