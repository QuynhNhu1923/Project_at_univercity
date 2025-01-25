package source.GUI;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.List;
import source.DataStructure.DataStructure;
import source.DataStructure.ListStruct;

public class AnimationHandler {
    private DataStructure dataStructure;
    private DemoPanel demoPanel;
    private JPanel visualizationPanel;
    private int[] lastSwappedIndices = { -1, -1 };

    public AnimationHandler(DataStructure dataStructure, DemoPanel demoPanel, JPanel visualizationPanel) {
        this.dataStructure = dataStructure;
        this.demoPanel = demoPanel;
        this.visualizationPanel = visualizationPanel;
    }

    public void drawElements(Graphics g) {
        List<Integer> elements = dataStructure.getElements();
        int x = 10;
        int y = 20;
        int boxWidth = 40;
        int boxHeight = 40;
        int spacing = 10;

        for (int index = 0; index < elements.size(); index++) {
            int value = elements.get(index);

            g.setColor(Color.decode("#fffd7a")); 
            g.fillRect(x, y, boxWidth, boxHeight);
            g.setColor(Color.BLACK);
            g.drawRect(x, y, boxWidth, boxHeight);
            g.drawString(String.valueOf(value), x + 15, y + 25);

            if (index == lastSwappedIndices[0] || index == lastSwappedIndices[1]) {
                g.setColor(Color.RED);
                g.fillPolygon(new int[] { x + 20, x + 15, x + 25 },
                        new int[] { y + boxHeight + 5, y + boxHeight + 15, y + boxHeight + 15 }, 3);
            }

            x += boxWidth + spacing;
            if (x > demoPanel.getWidth() - boxWidth) {
                x = 10;
                y += boxHeight + spacing;
            }
        }
    }

    public void animateStackQueueInsertion(int value) {
        int targetX = 10 + dataStructure.getElements().size() * 50; // Target position
        final int[] currentX = { 0 };

        javax.swing.Timer timer = new javax.swing.Timer(40, (ActionEvent e) -> {
            Graphics g = visualizationPanel.getGraphics();
            g.clearRect(0, 0, visualizationPanel.getWidth(), visualizationPanel.getHeight());
            drawElements(g);

            g.setColor(Color.RED);
            g.drawRect(currentX[0], 20, 40, 40);
            g.drawString(String.valueOf(value), currentX[0] + 15, 40);

            if (currentX[0] >= targetX) {
                ((javax.swing.Timer) e.getSource()).stop();
                dataStructure.insert(value);
                demoPanel.repaintVisualization();
            }
            currentX[0] += 10;
        });
        timer.start();
    }

    public void animateListInsertion(int value, int targetIndex) {
        final int[] index = { targetIndex };
        int targetX;

        if (index[0] >= 0 && index[0] <= dataStructure.getElements().size()) {
            targetX = 10 + index[0] * 50;
        } else {
            targetX = 10 + dataStructure.getElements().size() * 50;
            index[0] = dataStructure.getElements().size();
        }

        final int[] currentX = { 0 };
        javax.swing.Timer timer = new javax.swing.Timer(40, (ActionEvent e) -> {
            Graphics g = visualizationPanel.getGraphics();
            g.clearRect(0, 0, visualizationPanel.getWidth(), visualizationPanel.getHeight());
            drawElements(g);

            g.setColor(Color.BLUE);
            g.drawRect(currentX[0], 20, 40, 40);
            g.drawString(String.valueOf(value), currentX[0] + 15, 40);

            if (currentX[0] >= targetX) {
                ((javax.swing.Timer) e.getSource()).stop();

                ((ListStruct) dataStructure).insert(value, index[0]);
                demoPanel.repaintVisualization();
            }
            currentX[0] += 10;
        });
        timer.start();
    }

    public void animateStackDelete() {
        if (dataStructure.getElements().isEmpty()) {
            JOptionPane.showMessageDialog(demoPanel, "Stack is empty. Nothing to delete.", "Error",
                    JOptionPane.ERROR_MESSAGE);
            return;
        }

        int valueToDelete = dataStructure.getElements().get(dataStructure.getElements().size() - 1); // Top element
        int startY = 20;
        int targetY = -50;

        javax.swing.Timer timer = new javax.swing.Timer(40, null);
        timer.addActionListener(new ActionListener() {
            int currentY = startY;

            @Override
            public void actionPerformed(ActionEvent e) {
                Graphics g = visualizationPanel.getGraphics();
                g.clearRect(0, 0, visualizationPanel.getWidth(), visualizationPanel.getHeight());
                drawElements(g);

                g.setColor(Color.RED);
                g.drawRect(10 + (dataStructure.getElements().size() - 1) * 50, currentY, 40, 40);
                g.drawString(String.valueOf(valueToDelete), 10 + (dataStructure.getElements().size() - 1) * 50 + 15,
                        currentY + 25);

                if (currentY <= targetY) {
                    ((javax.swing.Timer) e.getSource()).stop();
                    dataStructure.delete(valueToDelete); 
                    demoPanel.repaintVisualization();
                }
                currentY -= 10; 
            }
        });
        timer.start();
    }

    public void animateQueueDelete() {
        if (dataStructure.getElements().isEmpty()) {
            JOptionPane.showMessageDialog(demoPanel, "Queue is empty. Nothing to delete.", "Error",
                    JOptionPane.ERROR_MESSAGE);
            return;
        }

        int valueToDelete = dataStructure.getElements().get(0); // Front element
        int startX = 10;
        int targetX = -50;

        javax.swing.Timer timer = new javax.swing.Timer(40, null);
        timer.addActionListener(new ActionListener() {
            int currentX = startX;

            @Override
            public void actionPerformed(ActionEvent e) {
                Graphics g = visualizationPanel.getGraphics();
                g.clearRect(0, 0, visualizationPanel.getWidth(), visualizationPanel.getHeight());
                drawElements(g);

                g.setColor(Color.RED);
                g.drawRect(currentX, 20, 40, 40);
                g.drawString(String.valueOf(valueToDelete), currentX + 15, 45);

                if (currentX <= targetX) {
                    ((javax.swing.Timer) e.getSource()).stop();
                    dataStructure.delete(valueToDelete); 
                    demoPanel.repaintVisualization();
                }
                currentX -= 10; 
            }
        });
        timer.start();
    }

    public void animateListDelete(int index) {
        if (index < 0 || index >= dataStructure.getElements().size()) {
            JOptionPane.showMessageDialog(demoPanel, "Invalid index. Please provide a valid index.", "Error",
                    JOptionPane.ERROR_MESSAGE);
            return;
        }

        int valueToDelete = dataStructure.getElements().get(index); // Element to delete
        int startX = 10 + index * 50; // Starting position based on the index
        int targetX = startX - 50;

        javax.swing.Timer timer = new javax.swing.Timer(40, null);
        timer.addActionListener(new ActionListener() {
            int currentX = startX;

            @Override
            public void actionPerformed(ActionEvent e) {
                Graphics g = visualizationPanel.getGraphics();
                g.clearRect(0, 0, visualizationPanel.getWidth(), visualizationPanel.getHeight());
                drawElements(g);

                g.setColor(Color.RED);
                g.drawRect(currentX, 20, 40, 40);
                g.drawString(String.valueOf(valueToDelete), currentX + 15, 45);

                if (currentX <= targetX) {
                    ((javax.swing.Timer) e.getSource()).stop();
                    dataStructure.getElements().remove(index); 
                    demoPanel.repaintVisualization();
                }
                currentX -= 10; 
            }
        });
        timer.start();
    }

    public void animateSort(JTextArea outputArea, String name) {
        List<Integer> elements = dataStructure.getElements();
        if (elements.isEmpty()) {
            JOptionPane.showMessageDialog(demoPanel, "No elements to sort.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        javax.swing.Timer timer = new javax.swing.Timer(200, null);
        final int[] i = { 0 };
        final int[] j = { 0 };

        timer.addActionListener(e -> {
            if (i[0] < elements.size() - 1) {
                if (j[0] < elements.size() - 1 - i[0]) {
                    if (elements.get(j[0]) > elements.get(j[0] + 1)) {
                        int temp = elements.get(j[0]);
                        elements.set(j[0], elements.get(j[0] + 1));
                        elements.set(j[0] + 1, temp);

                        lastSwappedIndices[0] = j[0];
                        lastSwappedIndices[1] = j[0] + 1;

                        demoPanel.repaintVisualization();
                    }
                    j[0]++;
                } else {
                    j[0] = 0;
                    i[0]++;
                }
            } else {
                ((javax.swing.Timer) e.getSource()).stop();
                lastSwappedIndices[0] = -1;
                lastSwappedIndices[1] = -1;
                demoPanel.repaintVisualization();
                outputArea.append(name + " sorted: " + elements + "\n");
            }
        });

        timer.start();
    }
}
