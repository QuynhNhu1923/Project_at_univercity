package source.GUI;

import javax.swing.*;
import java.awt.*;

import source.DataStructure.ListStruct;
import source.DataStructure.Queue;
import source.DataStructure.Stack;

public class MainMenu extends JFrame {
    private static final long serialVersionUID = 1L;

    public MainMenu() {
        setTitle("Data Structure Operations");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(400, 300);
        setLayout(new BorderLayout());
        getContentPane().setBackground(Color.decode("#ffffff"));

        JLabel titleLabel = new JLabel("Data Structure Demonstration", SwingConstants.CENTER);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 18));
        add(titleLabel, BorderLayout.NORTH);

        JPanel buttonPanel = new JPanel(new GridLayout(4, 1, 10, 10));
        buttonPanel.setBackground(Color.decode("#FFFFFF"));
        JButton stackButton = new JButton("Stack");
        stackButton.setBackground(Color.decode("#CDEDDD"));
        JButton queueButton = new JButton("Queue");
        queueButton.setBackground(Color.decode("#C0E9ED"));
        JButton listButton = new JButton("List");
        listButton.setBackground(Color.decode("#FCE6D3"));
        JButton helpButton = new JButton("Help");
        helpButton.setBackground(Color.decode("#FAD9D5"));
        JButton quitButton = new JButton("Quit");
        quitButton.setBackground(Color.decode("#FBB7C7"));

        stackButton.addActionListener(e -> openDemo(new DemoPanel(new Stack(), "Stack")));
        queueButton.addActionListener(e -> openDemo(new DemoPanel(new Queue(), "Queue")));
        listButton.addActionListener(e -> openDemo(new DemoPanel(new ListStruct(), "List")));
        helpButton.addActionListener(e -> showHelp());
        quitButton.addActionListener(e -> confirmQuit());

        buttonPanel.add(stackButton);
        buttonPanel.add(queueButton);
        buttonPanel.add(listButton);
        buttonPanel.add(helpButton);
        buttonPanel.add(quitButton);

        add(buttonPanel, BorderLayout.CENTER);
    }

    private void openWindow(String title, JPanel panel, int width, int height) {
        JFrame frame = new JFrame(title);
        frame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        frame.setSize(width, height);
        frame.add(panel);
        frame.setVisible(true);
    }

    private void openDemo(JPanel demoPanel) {
        openWindow(demoPanel.getName(), demoPanel, 500, 400);
    }

    private void showHelp() {
        JOptionPane.showMessageDialog(this,
                "This application demonstrates basic operations on Stack, Queue, and List structures.\nChoose a structure to begin.",
                "Help", JOptionPane.INFORMATION_MESSAGE);
    }

    private void confirmQuit() {
        int choice = JOptionPane.showConfirmDialog(this, "Are you sure you want to quit?", "Confirm Exit",
                JOptionPane.YES_NO_OPTION);
        if (choice == JOptionPane.YES_OPTION) {
            System.exit(0);
        }
    }
}
